import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth-token";
import { document_type, document_upload_mode, new_connection_status } from "../../../../../../generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateKycRequestBody = {
  requiredDocuments?: unknown;
  required_documents?: unknown;
  uploadMode?: unknown;
  upload_mode?: unknown;
  expiresAt?: unknown;
  expires_at?: unknown;
  expiresInDays?: unknown;
  expires_in_days?: unknown;
};

const DEFAULT_REQUIRED_DOCUMENTS: document_type[] = ["ID_PROOF", "ADDRESS_PROOF"];
const DEFAULT_EXPIRY_DAYS = 7;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 30;

const BLOCKED_CONNECTION_STATUSES: new_connection_status[] = [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "PAYMENT_DROPPED",
  "CANCELLED",
  "REFUNDED",
];

const VALID_DOCUMENT_TYPES = new Set<string>(Object.values(document_type));
const VALID_UPLOAD_MODES = new Set<string>(Object.values(document_upload_mode));

function createUploadToken(): string {
  return randomBytes(32).toString("base64url");
}

async function parseBody(req: NextRequest): Promise<CreateKycRequestBody | null> {
  try {
    const rawBody = await req.text();
    if (!rawBody.trim()) return {};

    const parsed = JSON.parse(rawBody);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeRequiredDocuments(value: unknown): document_type[] | null {
  if (typeof value === "undefined") return DEFAULT_REQUIRED_DOCUMENTS;
  if (!Array.isArray(value) || value.length === 0) return null;

  const uniqueDocuments = new Set<document_type>();
  for (const item of value) {
    if (typeof item !== "string" || !VALID_DOCUMENT_TYPES.has(item)) {
      return null;
    }
    uniqueDocuments.add(item as document_type);
  }

  return Array.from(uniqueDocuments);
}

function normalizeUploadMode(value: unknown): document_upload_mode | null {
  if (typeof value === "undefined") return "CUSTOMER_LINK";
  if (typeof value !== "string" || !VALID_UPLOAD_MODES.has(value)) return null;
  return value as document_upload_mode;
}

function normalizeExpiresAt(expiresAtValue: unknown, expiresInDaysValue: unknown): Date | null {
  if (typeof expiresAtValue === "string" && expiresAtValue.trim()) {
    const expiresAt = new Date(expiresAtValue);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return expiresAt;
  }

  const rawDays = typeof expiresInDaysValue === "undefined" ? DEFAULT_EXPIRY_DAYS : expiresInDaysValue;
  if (typeof rawDays !== "number" || !Number.isInteger(rawDays)) {
    return null;
  }

  if (rawDays < MIN_EXPIRY_DAYS || rawDays > MAX_EXPIRY_DAYS) {
    return null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + rawDays);
  return expiresAt;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requiredDocuments = normalizeRequiredDocuments(body.requiredDocuments ?? body.required_documents);
  if (!requiredDocuments) {
    return NextResponse.json({ error: "requiredDocuments must contain valid document types" }, { status: 400 });
  }

  const uploadMode = normalizeUploadMode(body.uploadMode ?? body.upload_mode);
  if (!uploadMode) {
    return NextResponse.json({ error: "uploadMode must be CUSTOMER_LINK or MANUAL_UPLOAD" }, { status: 400 });
  }

  const expiresAt = normalizeExpiresAt(body.expiresAt ?? body.expires_at, body.expiresInDays ?? body.expires_in_days);
  if (!expiresAt) {
    return NextResponse.json({ error: "Expiry must be a future date or 1-30 days from now" }, { status: 400 });
  }

  try {
    const connectionRequest = await prisma.new_connection_requests.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        customer_name: true,
        customer_email: true,
        customer_phone: true,
      },
    });

    if (!connectionRequest) {
      return NextResponse.json({ error: "New connection request not found" }, { status: 404 });
    }

    if (BLOCKED_CONNECTION_STATUSES.includes(connectionRequest.status)) {
      return NextResponse.json(
        { error: "KYC request cannot be created for this connection status" },
        { status: 409 },
      );
    }

    const now = new Date();
    const existingRequest = await prisma.document_upload_requests.findFirst({
      where: {
        new_connection_request_id: id,
        status: "PENDING",
        expires_at: { gt: now },
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        token: true,
        status: true,
        upload_mode: true,
        required_documents: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "An active KYC request already exists for this connection",
          request: {
            ...existingRequest,
            expires_at: existingRequest.expires_at.toISOString(),
            created_at: existingRequest.created_at.toISOString(),
            updated_at: existingRequest.updated_at.toISOString(),
          },
        },
        { status: 409 },
      );
    }

    await prisma.document_upload_requests.updateMany({
      where: {
        new_connection_request_id: id,
        status: "PENDING",
        expires_at: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    const documentUploadRequest = await prisma.document_upload_requests.create({
      data: {
        token: createUploadToken(),
        new_connection_request_id: id,
        required_documents: requiredDocuments,
        upload_mode: uploadMode,
        expires_at: expiresAt,
        created_by_id: user.userId,
      },
      select: {
        id: true,
        token: true,
        status: true,
        upload_mode: true,
        required_documents: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        new_connection_request: {
          select: {
            id: true,
            customer_name: true,
            customer_email: true,
            customer_phone: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        request: {
          ...documentUploadRequest,
          expires_at: documentUploadRequest.expires_at.toISOString(),
          created_at: documentUploadRequest.created_at.toISOString(),
          updated_at: documentUploadRequest.updated_at.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("api/admin/new-connections/[id]/kyc-request POST error:", err);
    return NextResponse.json({ error: "Failed to create KYC request" }, { status: 500 });
  }
}
