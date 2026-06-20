import { NextRequest, NextResponse } from "next/server";
import { document_type } from "../../../../../generated/prisma/enums";
import { prisma } from "../../../../../lib/prisma";
import { getS3ObjectMetadata, S3_KYC_UPLOAD_CONTENT_TYPE } from "../../../../../lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmUploadBody = {
  documentType?: unknown;
  document_type?: unknown;
  fileName?: unknown;
  file_name?: unknown;
  fileSize?: unknown;
  file_size?: unknown;
  mimeType?: unknown;
  mime_type?: unknown;
  s3Key?: unknown;
  s3_key?: unknown;
};

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const VALID_DOCUMENT_TYPES = new Set<string>(Object.values(document_type));

async function parseBody(req: NextRequest): Promise<ConfirmUploadBody | null> {
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
  if (fileName.includes("/") || fileName.includes("\\")) return null;
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

function normalizeS3Key(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const s3Key = value.trim();
  if (!s3Key || s3Key.length > 512) return null;
  if (s3Key.startsWith("/") || s3Key.includes("..")) return null;
  if (!s3Key.toLowerCase().endsWith(".pdf")) return null;

  return s3Key;
}

function isExpectedKycKey({
  s3Key,
  newConnectionRequestId,
  documentUploadRequestId,
  documentType,
}: {
  s3Key: string;
  newConnectionRequestId: string;
  documentUploadRequestId: string;
  documentType: document_type;
}) {
  const segments = s3Key.split("/");

  return (
    segments.length === 5 &&
    segments[1] === newConnectionRequestId &&
    segments[2] === documentUploadRequestId &&
    segments[3] === documentType &&
    segments[4].toLowerCase().endsWith(".pdf")
  );
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

  const s3Key = normalizeS3Key(body.s3Key ?? body.s3_key);
  if (!s3Key) {
    return NextResponse.json({ error: "Valid s3Key is required" }, { status: 400 });
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

    if (
      !isExpectedKycKey({
        s3Key,
        newConnectionRequestId: uploadRequest.new_connection_request_id,
        documentUploadRequestId: uploadRequest.id,
        documentType,
      })
    ) {
      return NextResponse.json({ error: "s3Key does not belong to this upload request" }, { status: 400 });
    }

    let objectMetadata: Awaited<ReturnType<typeof getS3ObjectMetadata>>;
    try {
      objectMetadata = await getS3ObjectMetadata({ key: s3Key });
    } catch {
      return NextResponse.json({ error: "Uploaded file could not be verified" }, { status: 400 });
    }

    const uploadedFileSize = objectMetadata.ContentLength;
    if (typeof uploadedFileSize !== "number" || uploadedFileSize <= 0 || uploadedFileSize > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: "Uploaded file size is invalid" }, { status: 400 });
    }

    if (uploadedFileSize !== fileSize) {
      return NextResponse.json({ error: "Uploaded file size does not match confirmation data" }, { status: 400 });
    }

    const uploadedMimeType = objectMetadata.ContentType?.toLowerCase().split(";")[0].trim();
    if (uploadedMimeType !== mimeType) {
      return NextResponse.json({ error: "Uploaded file type does not match confirmation data" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.document_upload_files.deleteMany({
        where: {
          document_upload_request_id: uploadRequest.id,
          document_type: documentType,
        },
      });

      const file = await tx.document_upload_files.create({
        data: {
          document_upload_request_id: uploadRequest.id,
          document_type: documentType,
          original_file_name: fileName,
          s3_key: s3Key,
          mime_type: mimeType,
          file_size: uploadedFileSize,
          uploaded_by_type: "CUSTOMER",
        },
        select: {
          id: true,
          document_type: true,
          original_file_name: true,
          mime_type: true,
          file_size: true,
          created_at: true,
        },
      });

      const confirmedFiles = await tx.document_upload_files.findMany({
        where: { document_upload_request_id: uploadRequest.id },
        select: { document_type: true },
      });

      const confirmedDocumentTypes = new Set(confirmedFiles.map((confirmedFile) => confirmedFile.document_type));
      const remainingDocuments = uploadRequest.required_documents.filter(
        (requiredDocument) => !confirmedDocumentTypes.has(requiredDocument),
      );
      const isComplete = remainingDocuments.length === 0;

      const updatedRequest = isComplete
        ? await tx.document_upload_requests.update({
            where: { id: uploadRequest.id },
            data: { status: "SUBMITTED" },
            select: { id: true, status: true, updated_at: true },
          })
        : await tx.document_upload_requests.findUniqueOrThrow({
            where: { id: uploadRequest.id },
            select: { id: true, status: true, updated_at: true },
          });

      if (isComplete) {
        await tx.new_connection_requests.updateMany({
          where: {
            id: uploadRequest.new_connection_request_id,
            status: "PAID",
          },
          data: { status: "UNDER_REVIEW" },
        });
      }

      return {
        file,
        request: updatedRequest,
        confirmedDocumentTypes: Array.from(confirmedDocumentTypes),
        remainingDocuments,
      };
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: result.request.id,
        status: result.request.status,
        updatedAt: result.request.updated_at.toISOString(),
        confirmedDocuments: result.confirmedDocumentTypes,
        remainingDocuments: result.remainingDocuments,
      },
      file: {
        id: result.file.id,
        documentType: result.file.document_type,
        originalFileName: result.file.original_file_name,
        mimeType: result.file.mime_type,
        fileSize: result.file.file_size,
        createdAt: result.file.created_at.toISOString(),
      },
    });
  } catch (err) {
    console.error("api/document-uploads/[token]/confirm POST error:", err);
    return NextResponse.json({ error: "Failed to confirm document upload" }, { status: 500 });
  }
}
