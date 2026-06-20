-- CreateEnum
CREATE TYPE "document_upload_status" AS ENUM ('PENDING', 'SUBMITTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "document_upload_mode" AS ENUM ('CUSTOMER_LINK', 'MANUAL_UPLOAD');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('ID_PROOF', 'ADDRESS_PROOF', 'CUSTOMER_PHOTO', 'BUSINESS_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "document_upload_actor" AS ENUM ('CUSTOMER', 'ADMIN', 'TECHNICIAN');

-- CreateTable
CREATE TABLE "document_upload_requests" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "new_connection_request_id" TEXT NOT NULL,
    "status" "document_upload_status" NOT NULL DEFAULT 'PENDING',
    "upload_mode" "document_upload_mode" NOT NULL DEFAULT 'CUSTOMER_LINK',
    "required_documents" "document_type"[] NOT NULL DEFAULT ARRAY['ID_PROOF', 'ADDRESS_PROOF']::"document_type"[],
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_upload_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_upload_files" (
    "id" TEXT NOT NULL,
    "document_upload_request_id" TEXT NOT NULL,
    "document_type" "document_type" NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT,
    "uploaded_by_type" "document_upload_actor" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_upload_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uk_document_upload_requests_token" ON "document_upload_requests"("token");

-- CreateIndex
CREATE INDEX "idx_document_upload_requests_connection" ON "document_upload_requests"("new_connection_request_id");

-- CreateIndex
CREATE INDEX "idx_document_upload_requests_created_by" ON "document_upload_requests"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_document_upload_requests_status_expires" ON "document_upload_requests"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uk_document_upload_files_s3_key" ON "document_upload_files"("s3_key");

-- CreateIndex
CREATE INDEX "idx_document_upload_files_request" ON "document_upload_files"("document_upload_request_id");

-- CreateIndex
CREATE INDEX "idx_document_upload_files_type" ON "document_upload_files"("document_type");

-- CreateIndex
CREATE INDEX "idx_document_upload_files_uploaded_by" ON "document_upload_files"("uploaded_by_id");

-- AddForeignKey
ALTER TABLE "document_upload_requests" ADD CONSTRAINT "document_upload_requests_new_connection_request_id_fkey" FOREIGN KEY ("new_connection_request_id") REFERENCES "new_connection_requests"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "document_upload_requests" ADD CONSTRAINT "document_upload_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "document_upload_files" ADD CONSTRAINT "document_upload_files_request_id_fkey" FOREIGN KEY ("document_upload_request_id") REFERENCES "document_upload_requests"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "document_upload_files" ADD CONSTRAINT "document_upload_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE RESTRICT;
