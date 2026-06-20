import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../../lib/auth-token";
import { sendPlainEmail } from "../../../../../../lib/email";
import { prisma } from "../../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppBaseUrl(req: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  const origin = req.nextUrl.origin;
  return origin.replace(/\/+$/, "");
}

function formatDocumentName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getRejectedResponse(status: "SUBMITTED" | "EXPIRED" | "CANCELLED") {
  if (status === "SUBMITTED") {
    return NextResponse.json({ error: "Documents have already been submitted for this request" }, { status: 409 });
  }

  if (status === "CANCELLED") {
    return NextResponse.json({ error: "This document upload request has been cancelled" }, { status: 410 });
  }

  return NextResponse.json({ error: "This document upload request has expired" }, { status: 410 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;
  const safeId = typeof id === "string" ? id.trim() : "";

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!safeId) {
    return NextResponse.json({ error: "Document upload request id is required" }, { status: 400 });
  }

  try {
    const uploadRequest = await prisma.document_upload_requests.findUnique({
      where: { id: safeId },
      select: {
        id: true,
        token: true,
        status: true,
        upload_mode: true,
        required_documents: true,
        expires_at: true,
        new_connection_request: {
          select: {
            id: true,
            customer_name: true,
            customer_email: true,
            customer_phone: true,
            plan_variants: {
              select: {
                speed_mbps: true,
                duration_months: true,
                plans: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!uploadRequest) {
      return NextResponse.json({ error: "Document upload request not found" }, { status: 404 });
    }

    const now = new Date();
    if (uploadRequest.status === "PENDING" && uploadRequest.expires_at <= now) {
      await prisma.document_upload_requests.update({
        where: { id: uploadRequest.id },
        data: { status: "EXPIRED" },
      });

      return getRejectedResponse("EXPIRED");
    }

    if (uploadRequest.status !== "PENDING") {
      return getRejectedResponse(uploadRequest.status);
    }

    if (uploadRequest.upload_mode !== "CUSTOMER_LINK") {
      return NextResponse.json({ error: "This request is configured for manual upload" }, { status: 409 });
    }

    const connectionRequest = uploadRequest.new_connection_request;
    const uploadUrl = `${getAppBaseUrl(req)}/document-uploads/${uploadRequest.token}`;
    const planText = `${connectionRequest.plan_variants.plans.name} ${connectionRequest.plan_variants.speed_mbps} Mbps for ${connectionRequest.plan_variants.duration_months} months`;
    const requiredDocumentsText = uploadRequest.required_documents.map(formatDocumentName).join(", ");

    await sendPlainEmail({
      to: connectionRequest.customer_email,
      subject: "Upload KYC documents for your Connect One connection",
      text: [
        `Hi ${connectionRequest.customer_name},`,
        "",
        "Please upload the required KYC documents for your new Connect One broadband connection.",
        "",
        `Plan: ${planText}`,
        `Required documents: ${requiredDocumentsText}`,
        `Upload link: ${uploadUrl}`,
        `Link expires on: ${uploadRequest.expires_at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
        "",
        "If you did not request this connection, please contact Connect One support.",
        "",
        "Regards,",
        "Connect One Networks",
      ].join("\n"),
    });

    return NextResponse.json({
      ok: true,
      sentTo: connectionRequest.customer_email,
      uploadUrl,
      request: {
        id: uploadRequest.id,
        status: uploadRequest.status,
        uploadMode: uploadRequest.upload_mode,
        expiresAt: uploadRequest.expires_at.toISOString(),
        requiredDocuments: uploadRequest.required_documents,
      },
      connection: {
        id: connectionRequest.id,
        customerName: connectionRequest.customer_name,
        customerEmail: connectionRequest.customer_email,
        customerPhone: connectionRequest.customer_phone,
      },
    });
  } catch (err) {
    console.error("api/admin/document-uploads/[id]/send-link POST error:", err);
    return NextResponse.json({ error: "Failed to send document upload link" }, { status: 500 });
  }
}
