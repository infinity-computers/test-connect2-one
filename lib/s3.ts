import "server-only";

import { randomUUID } from "crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_KYC_PREFIX = "kyc";
const DEFAULT_UPLOAD_EXPIRES_SECONDS = 5 * 60;
const DEFAULT_DOWNLOAD_EXPIRES_SECONDS = 2 * 60;
const PDF_CONTENT_TYPE = "application/pdf";

type S3Config = {
  region: string;
  bucketName: string;
  kycPrefix: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type BuildKycObjectKeyInput = {
  newConnectionRequestId: string;
  documentUploadRequestId: string;
  documentType: string;
  originalFileName?: string;
};

type PresignedUploadUrlInput = {
  key: string;
  contentType?: string;
  expiresIn?: number;
};

type PresignedDownloadUrlInput = {
  key: string;
  fileName?: string;
  expiresIn?: number;
};

type ObjectMetadataInput = {
  key: string;
};

let s3Client: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

function getS3Config(): S3Config {
  return {
    region: getRequiredEnv("AWS_REGION"),
    bucketName: getRequiredEnv("AWS_S3_BUCKET_NAME"),
    kycPrefix: process.env.AWS_S3_KYC_PREFIX || DEFAULT_KYC_PREFIX,
    accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
  };
}

function getS3Client() {
  if (s3Client) return s3Client;

  const config = getS3Config();
  s3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return s3Client;
}

function sanitizeKeySegment(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

function getSafeFileExtension(fileName?: string) {
  if (!fileName) return ".pdf";

  const extension = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  return extension === ".pdf" ? extension : ".pdf";
}

export function buildKycObjectKey({
  newConnectionRequestId,
  documentUploadRequestId,
  documentType,
  originalFileName,
}: BuildKycObjectKeyInput) {
  const { kycPrefix } = getS3Config();
  const extension = getSafeFileExtension(originalFileName);

  return [
    sanitizeKeySegment(kycPrefix),
    sanitizeKeySegment(newConnectionRequestId),
    sanitizeKeySegment(documentUploadRequestId),
    sanitizeKeySegment(documentType),
    `${randomUUID()}${extension}`,
  ].join("/");
}

export async function createPresignedUploadUrl({
  key,
  contentType = PDF_CONTENT_TYPE,
  expiresIn = DEFAULT_UPLOAD_EXPIRES_SECONDS,
}: PresignedUploadUrlInput) {
  const { bucketName } = getS3Config();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function createPresignedDownloadUrl({
  key,
  fileName,
  expiresIn = DEFAULT_DOWNLOAD_EXPIRES_SECONDS,
}: PresignedDownloadUrlInput) {
  const { bucketName } = getS3Config();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: fileName
      ? `attachment; filename="${fileName.replace(/"/g, "")}"`
      : undefined,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function getS3ObjectMetadata({ key }: ObjectMetadataInput) {
  const { bucketName } = getS3Config();
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getS3Client().send(command);
}

export const S3_KYC_UPLOAD_CONTENT_TYPE = PDF_CONTENT_TYPE;
export const S3_KYC_UPLOAD_EXPIRES_SECONDS = DEFAULT_UPLOAD_EXPIRES_SECONDS;
export const S3_KYC_DOWNLOAD_EXPIRES_SECONDS = DEFAULT_DOWNLOAD_EXPIRES_SECONDS;
