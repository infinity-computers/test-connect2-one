import { NextRequest, NextResponse } from "next/server";
import { document_type } from "../../../../../generated/prisma/enums";
import { prisma } from "../../../../../lib/prisma";
import {
  buildKycObjectKey,
  createPresignedUploadUrl,
  S3_KYC_UPLOAD_CONTENT_TYPE,
  S3_KYC_UPLOAD_EXPIRES_SECONDS,
} from "../../../../../lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PresignUploadBody = {
  documentType?: unknown;
  document_type?: unknown;
  fileName?: unknown;
  file_name?: unknown;
  fileSize?: unknown;
  file_size?: unknown;
  mimeType?: unknown;
  mime_type?: unknown;
};

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_DOCUMENT_TYPES = new Set<string>(Object.values(document_type));

async function parseBody(req: NextRequest): Promise<PresignUploadBody | null> {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeDocumentType(value: unknown): document_type | null {
  if (typeof value !== "string" || !VALID_DOCUMENT_TYPES.has(value)) return null;
  return value as document_type;
}

function normalizeFileName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const fileName = value.trim();
  if (!fileName || fileName.length > 180) return null;
  if (!fileName.toLowerCase().endsWith(".pdf")) return null;

  return fileName;
}

function normalizeFileSize(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value <= 0 || value > MAX_UPLOAD_SIZE_BYTES) return null;
  return value;
}

function normalizeMimeType(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const mimeType = value.trim().toLowerCase();
  return mimeType === S3_KYC_UPLOAD_CONTENT_TYPE ? mimeType : null;
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const safeToken = typeof token === "string" ? token.trim() : "";

  if (!safeToken) {
    return NextResponse.json({ error: "Upload token is required" }, { status: 400 });
  }

  const body = await parseBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const documentType = normalizeDocumentType(body.documentType ?? body.document_type);
  if (!documentType) {
    return NextResponse.json({ error: "Valid documentType is required" }, { status: 400 });
  }

  const fileName = normalizeFileName(body.fileName ?? body.file_name);
  if (!fileName) {
    return NextResponse.json({ error: "A PDF fileName is required" }, { status: 400 });
  }

  const fileSize = normalizeFileSize(body.fileSize ?? body.file_size);
  if (!fileSize) {
    return NextResponse.json({ error: "fileSize must be between 1 byte and 10 MB" }, { status: 400 });
  }

  const mimeType = normalizeMimeType(body.mimeType ?? body.mime_type);
  if (!mimeType) {
    return NextResponse.json({ error: "Only application/pdf uploads are supported" }, { status: 400 });
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
        new_connection_request_id: true,
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

    if (uploadRequest.upload_mode !== "CUSTOMER_LINK") {
      return NextResponse.json({ error: "Customer upload is not enabled for this request" }, { status: 403 });
    }

    if (!uploadRequest.required_documents.includes(documentType)) {
      return NextResponse.json({ error: "This document type is not required for this request" }, { status: 400 });
    }

    const s3Key = buildKycObjectKey({
      newConnectionRequestId: uploadRequest.new_connection_request_id,
      documentUploadRequestId: uploadRequest.id,
      documentType,
      originalFileName: fileName,
    });

    const uploadUrl = await createPresignedUploadUrl({
      key: s3Key,
      contentType: mimeType,
    });

    return NextResponse.json({
      upload: {
        url: uploadUrl,
        method: "PUT",
        s3Key,
        documentType,
        fileName,
        fileSize,
        contentType: mimeType,
        expiresIn: S3_KYC_UPLOAD_EXPIRES_SECONDS,
        maxFileSizeBytes: MAX_UPLOAD_SIZE_BYTES,
        headers: {
          "Content-Type": mimeType,
        },
      },
    });
  } catch (err) {
    console.error("api/document-uploads/[token]/presign POST error:", err);
    return NextResponse.json({ error: "Failed to prepare document upload" }, { status: 500 });
  }
}
