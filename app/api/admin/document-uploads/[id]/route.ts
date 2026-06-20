import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth-token";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const request = await prisma.document_upload_requests.findUnique({
      where: { id: safeId },
      select: {
        id: true,
        status: true,
        upload_mode: true,
        required_documents: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        created_by: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        files: {
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            document_type: true,
            original_file_name: true,
            mime_type: true,
            file_size: true,
            uploaded_by_type: true,
            created_at: true,
            uploaded_by: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        new_connection_request: {
          select: {
            id: true,
            status: true,
            customer_name: true,
            customer_email: true,
            customer_phone: true,
            installation_address: true,
            city: true,
            state: true,
            pin_code: true,
            landmark: true,
            notes: true,
            amount: true,
            cashfree_order_id: true,
            cashfree_payment_id: true,
            paid_at: true,
            created_at: true,
            updated_at: true,
            plan_variants: {
              select: {
                speed_mbps: true,
                duration_months: true,
                price: true,
                plans: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
            tickets: {
              select: {
                id: true,
                tracking_code: true,
                status: true,
                assigned_technician_id: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Document upload request not found" }, { status: 404 });
    }

    const isExpiredPending = request.status === "PENDING" && request.expires_at <= new Date();
    const normalizedRequest = isExpiredPending
      ? await prisma.document_upload_requests.update({
          where: { id: request.id },
          data: { status: "EXPIRED" },
          select: {
            id: true,
            status: true,
            updated_at: true,
          },
        })
      : null;

    const status = normalizedRequest?.status ?? request.status;
    const updatedAt = normalizedRequest?.updated_at ?? request.updated_at;
    const confirmedDocumentTypes = new Set(request.files.map((file) => file.document_type));
    const remainingDocuments = request.required_documents.filter(
      (documentType) => !confirmedDocumentTypes.has(documentType),
    );

    return NextResponse.json({
      request: {
        id: request.id,
        status,
        uploadMode: request.upload_mode,
        requiredDocuments: request.required_documents,
        confirmedDocuments: Array.from(confirmedDocumentTypes),
        remainingDocuments,
        expiresAt: request.expires_at.toISOString(),
        createdAt: request.created_at.toISOString(),
        updatedAt: updatedAt.toISOString(),
        createdBy: request.created_by,
        files: request.files.map((file) => ({
          id: file.id,
          documentType: file.document_type,
          originalFileName: file.original_file_name,
          mimeType: file.mime_type,
          fileSize: file.file_size,
          uploadedByType: file.uploaded_by_type,
          uploadedBy: file.uploaded_by,
          createdAt: file.created_at.toISOString(),
          downloadPath: `/api/admin/document-uploads/files/${file.id}/download`,
        })),
        connection: {
          id: request.new_connection_request.id,
          status: request.new_connection_request.status,
          customerName: request.new_connection_request.customer_name,
          customerEmail: request.new_connection_request.customer_email,
          customerPhone: request.new_connection_request.customer_phone,
          installationAddress: request.new_connection_request.installation_address,
          city: request.new_connection_request.city,
          state: request.new_connection_request.state,
          pinCode: request.new_connection_request.pin_code,
          landmark: request.new_connection_request.landmark,
          notes: request.new_connection_request.notes,
          amount: Number(request.new_connection_request.amount),
          cashfreeOrderId: request.new_connection_request.cashfree_order_id,
          cashfreePaymentId: request.new_connection_request.cashfree_payment_id,
          paidAt: safeDate(request.new_connection_request.paid_at),
          createdAt: request.new_connection_request.created_at.toISOString(),
          updatedAt: request.new_connection_request.updated_at.toISOString(),
          plan: {
            id: request.new_connection_request.plan_variants.plans.id,
            name: request.new_connection_request.plan_variants.plans.name,
            description: request.new_connection_request.plan_variants.plans.description,
            speedMbps: request.new_connection_request.plan_variants.speed_mbps,
            durationMonths: request.new_connection_request.plan_variants.duration_months,
            price: Number(request.new_connection_request.plan_variants.price),
          },
          ticket: request.new_connection_request.tickets,
        },
      },
    });
  } catch (err) {
    console.error("api/admin/document-uploads/[id] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch document upload request" }, { status: 500 });
  }
}
