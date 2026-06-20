import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../../lib/auth-token";
import {
  createPresignedDownloadUrl,
  getS3ObjectMetadata,
  S3_KYC_DOWNLOAD_EXPIRES_SECONDS,
} from "../../../../../../../lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getCurrentUser(req);
  const { fileId } = await params;
  const safeFileId = typeof fileId === "string" ? fileId.trim() : "";

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!safeFileId) {
    return NextResponse.json({ error: "File id is required" }, { status: 400 });
  }

  try {
    const file = await prisma.document_upload_files.findUnique({
      where: { id: safeFileId },
      select: {
        id: true,
        document_type: true,
        original_file_name: true,
        s3_key: true,
        mime_type: true,
        file_size: true,
        uploaded_by_type: true,
        created_at: true,
        document_upload_request: {
          select: {
            id: true,
            status: true,
            upload_mode: true,
            new_connection_request: {
              select: {
                id: true,
                customer_name: true,
                customer_email: true,
                customer_phone: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Document file not found" }, { status: 404 });
    }

    try {
      await getS3ObjectMetadata({ key: file.s3_key });
    } catch {
      return NextResponse.json({ error: "Stored document file could not be found" }, { status: 404 });
    }

    const downloadUrl = await createPresignedDownloadUrl({
      key: file.s3_key,
      fileName: file.original_file_name,
    });

    return NextResponse.json({
      download: {
        url: downloadUrl,
        method: "GET",
        expiresIn: S3_KYC_DOWNLOAD_EXPIRES_SECONDS,
      },
      file: {
        id: file.id,
        documentType: file.document_type,
        originalFileName: file.original_file_name,
        mimeType: file.mime_type,
        fileSize: file.file_size,
        uploadedByType: file.uploaded_by_type,
        createdAt: file.created_at.toISOString(),
      },
      request: {
        id: file.document_upload_request.id,
        status: file.document_upload_request.status,
        uploadMode: file.document_upload_request.upload_mode,
      },
      connection: {
        id: file.document_upload_request.new_connection_request.id,
        customerName: file.document_upload_request.new_connection_request.customer_name,
        customerEmail: file.document_upload_request.new_connection_request.customer_email,
        customerPhone: file.document_upload_request.new_connection_request.customer_phone,
      },
    });
  } catch (err) {
    console.error("api/admin/document-uploads/files/[fileId]/download GET error:", err);
    return NextResponse.json({ error: "Failed to create document download link" }, { status: 500 });
  }
}
