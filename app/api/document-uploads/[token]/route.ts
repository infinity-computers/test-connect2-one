import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  const visibleName = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visibleName}${"*".repeat(Math.max(name.length - visibleName.length, 1))}@${domain}`;
}

function maskPhone(phone: string): string {
  const normalized = phone.trim();
  if (normalized.length <= 4) return normalized;

  return `${"*".repeat(Math.max(normalized.length - 4, 4))}${normalized.slice(-4)}`;
}

function getRejectedResponse(status: "SUBMITTED" | "EXPIRED" | "CANCELLED") {
  if (status === "SUBMITTED") {
    return NextResponse.json({ error: "Documents have already been submitted for this link" }, { status: 409 });
  }

  if (status === "CANCELLED") {
    return NextResponse.json({ error: "This document upload link has been cancelled" }, { status: 410 });
  }

  return NextResponse.json({ error: "This document upload link has expired" }, { status: 410 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const safeToken = typeof token === "string" ? token.trim() : "";

  if (!safeToken) {
    return NextResponse.json({ error: "Upload token is required" }, { status: 400 });
  }

  try {
    const uploadRequest = await prisma.document_upload_requests.findUnique({
      where: { token: safeToken },
      select: {
        id: true,
        status: true,
        upload_mode: true,
        required_documents: true,
        expires_at: true,
        created_at: true,
        new_connection_request: {
          select: {
            id: true,
            customer_name: true,
            customer_email: true,
            customer_phone: true,
            city: true,
            state: true,
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
      return NextResponse.json({ error: "Document upload link not found" }, { status: 404 });
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

    const connectionRequest = uploadRequest.new_connection_request;

    return NextResponse.json({
      request: {
        id: uploadRequest.id,
        status: uploadRequest.status,
        uploadMode: uploadRequest.upload_mode,
        requiredDocuments: uploadRequest.required_documents,
        expiresAt: uploadRequest.expires_at.toISOString(),
        createdAt: uploadRequest.created_at.toISOString(),
        connection: {
          id: connectionRequest.id,
          customerName: connectionRequest.customer_name,
          customerEmail: maskEmail(connectionRequest.customer_email),
          customerPhone: maskPhone(connectionRequest.customer_phone),
          city: connectionRequest.city,
          state: connectionRequest.state,
          plan: {
            name: connectionRequest.plan_variants.plans.name,
            speedMbps: connectionRequest.plan_variants.speed_mbps,
            durationMonths: connectionRequest.plan_variants.duration_months,
          },
        },
      },
    });
  } catch (err) {
    console.error("api/document-uploads/[token] GET error:", err);
    return NextResponse.json({ error: "Failed to verify document upload link" }, { status: 500 });
  }
}
