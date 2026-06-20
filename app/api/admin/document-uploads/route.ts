import { NextRequest, NextResponse } from "next/server";
import { document_upload_status } from "../../../../generated/prisma/enums";
import { getCurrentUser } from "../../../../lib/auth-token";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<string>(Object.values(document_upload_status));
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function normalizeLimit(value: string | null): number {
  if (!value) return DEFAULT_LIMIT;

  const limit = Number(value);
  if (!Number.isInteger(limit) || limit <= 0) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

function normalizeStatus(value: string | null): document_upload_status | null {
  if (!value) return null;
  return VALID_STATUSES.has(value) ? (value as document_upload_status) : null;
}

function safeDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const status = normalizeStatus(rawStatus);
  const connectionId = searchParams.get("connectionId")?.trim();
  const query = searchParams.get("q")?.trim();
  const limit = normalizeLimit(searchParams.get("limit"));

  if (rawStatus && !status) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  try {
    await prisma.document_upload_requests.updateMany({
      where: {
        status: "PENDING",
        expires_at: { lte: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const requests = await prisma.document_upload_requests.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(connectionId ? { new_connection_request_id: connectionId } : {}),
        ...(query
          ? {
              new_connection_request: {
                OR: [
                  { customer_name: { contains: query, mode: "insensitive" } },
                  { customer_email: { contains: query, mode: "insensitive" } },
                  { customer_phone: { contains: query, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
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
            role: true,
          },
        },
        _count: {
          select: { files: true },
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
          },
        },
        new_connection_request: {
          select: {
            id: true,
            status: true,
            customer_name: true,
            customer_email: true,
            customer_phone: true,
            city: true,
            state: true,
            pin_code: true,
            paid_at: true,
            created_at: true,
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

    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        status: request.status,
        uploadMode: request.upload_mode,
        requiredDocuments: request.required_documents,
        expiresAt: request.expires_at.toISOString(),
        createdAt: request.created_at.toISOString(),
        updatedAt: request.updated_at.toISOString(),
        createdBy: request.created_by,
        fileCount: request._count.files,
        files: request.files.map((file) => ({
          id: file.id,
          documentType: file.document_type,
          originalFileName: file.original_file_name,
          mimeType: file.mime_type,
          fileSize: file.file_size,
          uploadedByType: file.uploaded_by_type,
          createdAt: file.created_at.toISOString(),
          downloadPath: `/api/admin/document-uploads/files/${file.id}/download`,
        })),
        connection: {
          id: request.new_connection_request.id,
          status: request.new_connection_request.status,
          customerName: request.new_connection_request.customer_name,
          customerEmail: request.new_connection_request.customer_email,
          customerPhone: request.new_connection_request.customer_phone,
          city: request.new_connection_request.city,
          state: request.new_connection_request.state,
          pinCode: request.new_connection_request.pin_code,
          paidAt: safeDate(request.new_connection_request.paid_at),
          createdAt: request.new_connection_request.created_at.toISOString(),
          plan: {
            name: request.new_connection_request.plan_variants.plans.name,
            speedMbps: request.new_connection_request.plan_variants.speed_mbps,
            durationMonths: request.new_connection_request.plan_variants.duration_months,
          },
        },
      })),
    });
  } catch (err) {
    console.error("api/admin/document-uploads GET error:", err);
    return NextResponse.json({ error: "Failed to fetch document upload requests" }, { status: 500 });
  }
}
