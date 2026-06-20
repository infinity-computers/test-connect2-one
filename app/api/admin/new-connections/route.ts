import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  document_type,
  document_upload_mode,
  new_connection_payment_mode,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import { sendPlainEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const DEFAULT_REQUIRED_DOCUMENTS: document_type[] = ["ID_PROOF", "ADDRESS_PROOF"];
const DEFAULT_EXPIRY_DAYS = 7;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 30;

const VALID_DOCUMENT_TYPES = new Set<string>(Object.values(document_type));
const VALID_UPLOAD_MODES = new Set<string>(Object.values(document_upload_mode));
const VALID_PAYMENT_MODES = new Set<string>(Object.values(new_connection_payment_mode));

type AdminCreateConnectionBody = {
  planVariantId?: unknown;
  plan_variant_id?: unknown;
  planName?: unknown;
  plan_name?: unknown;
  speedMbps?: unknown;
  speed_mbps?: unknown;
  durationMonths?: unknown;
  duration_months?: unknown;
  name?: unknown;
  customerName?: unknown;
  customer_name?: unknown;
  phone?: unknown;
  customerPhone?: unknown;
  customer_phone?: unknown;
  email?: unknown;
  customerEmail?: unknown;
  customer_email?: unknown;
  address?: unknown;
  installationAddress?: unknown;
  installation_address?: unknown;
  city?: unknown;
  state?: unknown;
  pinCode?: unknown;
  pin_code?: unknown;
  landmark?: unknown;
  notes?: unknown;
  paymentMode?: unknown;
  payment_mode?: unknown;
  uploadMode?: unknown;
  upload_mode?: unknown;
  requiredDocuments?: unknown;
  required_documents?: unknown;
  expiresAt?: unknown;
  expires_at?: unknown;
  expiresInDays?: unknown;
  expires_in_days?: unknown;
  sendLink?: unknown;
  send_link?: unknown;
};

function safeDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createUploadToken(): string {
  return randomBytes(32).toString("base64url");
}

function getAppBaseUrl(req: NextRequest) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  return req.nextUrl.origin.replace(/\/+$/, "");
}

function formatDocumentName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
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

function normalizePaymentMode(value: unknown): new_connection_payment_mode | null {
  if (typeof value === "undefined") return "NOT_COLLECTED";
  if (typeof value !== "string" || !VALID_PAYMENT_MODES.has(value)) return null;
  return value as new_connection_payment_mode;
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

async function sendKycUploadLinkEmail({
  req,
  customerName,
  customerEmail,
  planText,
  requiredDocuments,
  token,
  expiresAt,
}: {
  req: NextRequest;
  customerName: string;
  customerEmail: string;
  planText: string;
  requiredDocuments: document_type[];
  token: string;
  expiresAt: Date;
}) {
  const uploadUrl = `${getAppBaseUrl(req)}/document-uploads/${token}`;
  const requiredDocumentsText = requiredDocuments.map(formatDocumentName).join(", ");

  await sendPlainEmail({
    to: customerEmail,
    subject: "Upload KYC documents for your Connect One connection",
    text: [
      `Hi ${customerName},`,
      "",
      "Please upload the required KYC documents for your new Connect One broadband connection.",
      "",
      `Plan: ${planText}`,
      `Required documents: ${requiredDocumentsText}`,
      `Upload link: ${uploadUrl}`,
      `Link expires on: ${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      "",
      "If you did not request this connection, please contact Connect One support.",
      "",
      "Regards,",
      "Connect One Networks",
    ].join("\n"),
  });

  return uploadUrl;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await prisma.new_connection_requests.findMany({
      orderBy: { created_at: "desc" },
      include: {
        plan_variants: { include: { plans: true } },
        tickets: { select: { id: true, tracking_code: true, status: true, assigned_technician_id: true } },
      },
    });

    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        status: request.status,
        request_source: request.request_source,
        payment_mode: request.payment_mode,
        customer_name: request.customer_name,
        customer_email: request.customer_email,
        customer_phone: request.customer_phone,
        installation_address: request.installation_address,
        city: request.city,
        state: request.state,
        pin_code: request.pin_code,
        landmark: request.landmark,
        notes: request.notes,
        amount: Number(request.amount),
        cashfree_order_id: request.cashfree_order_id,
        cashfree_payment_id: request.cashfree_payment_id,
        paid_at: safeDate(request.paid_at),
        reviewed_by_id: request.reviewed_by_id,
        reviewed_at: safeDate(request.reviewed_at),
        rejection_reason: request.rejection_reason,
        admin_notified_at: safeDate(request.admin_notified_at),
        customer_notified_at: safeDate(request.customer_notified_at),
        created_at: request.created_at.toISOString(),
        updated_at: request.updated_at.toISOString(),
        plan: {
          name: request.plan_variants.plans.name,
          speed_mbps: request.plan_variants.speed_mbps,
          duration_months: request.plan_variants.duration_months,
        },
        ticket: request.tickets,
      })),
    });
  } catch (err) {
    console.error("api/admin/new-connections GET error:", err);
    return NextResponse.json({ error: "Failed to fetch new connection requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AdminCreateConnectionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planVariantId = cleanString(body.planVariantId ?? body.plan_variant_id);
  const planName = cleanString(body.planName ?? body.plan_name);
  const speedMbps = Number(body.speedMbps ?? body.speed_mbps);
  const durationMonths = Number(body.durationMonths ?? body.duration_months);
  const name = cleanString(body.customerName ?? body.customer_name ?? body.name);
  const phone = cleanString(body.customerPhone ?? body.customer_phone ?? body.phone);
  const email = cleanString(body.customerEmail ?? body.customer_email ?? body.email).toLowerCase();
  const address = cleanString(body.installationAddress ?? body.installation_address ?? body.address);
  const city = cleanString(body.city);
  const state = cleanString(body.state);
  const pinCode = cleanString(body.pinCode ?? body.pin_code);
  const landmark = optionalString(body.landmark);
  const notes = optionalString(body.notes);
  const sendLink = typeof (body.sendLink ?? body.send_link) === "boolean" ? Boolean(body.sendLink ?? body.send_link) : true;

  const uploadMode = normalizeUploadMode(body.uploadMode ?? body.upload_mode);
  const paymentMode = normalizePaymentMode(body.paymentMode ?? body.payment_mode);
  const requiredDocuments = normalizeRequiredDocuments(body.requiredDocuments ?? body.required_documents);
  const expiresAt = normalizeExpiresAt(body.expiresAt ?? body.expires_at, body.expiresInDays ?? body.expires_in_days);

  if ((!planVariantId && (!planName || !speedMbps || !durationMonths)) || (planVariantId && (planName || speedMbps || durationMonths))) {
    return NextResponse.json({ error: "Provide either planVariantId or planName, speedMbps, and durationMonths" }, { status: 400 });
  }

  if (!name || !phone || !email || !address || !city || !state || !pinCode) {
    return NextResponse.json(
      { error: "Name, phone, email, address, city, state, and pin code are required" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (!uploadMode) {
    return NextResponse.json({ error: "uploadMode must be CUSTOMER_LINK or MANUAL_UPLOAD" }, { status: 400 });
  }

  if (!paymentMode) {
    return NextResponse.json({ error: "Invalid paymentMode" }, { status: 400 });
  }

  if (!requiredDocuments) {
    return NextResponse.json({ error: "requiredDocuments must contain valid document types" }, { status: 400 });
  }

  if (!expiresAt) {
    return NextResponse.json({ error: "Expiry must be a future date or 1-30 days from now" }, { status: 400 });
  }

  try {
    const variant = planVariantId
      ? await prisma.plan_variants.findUnique({
          where: { id: planVariantId },
          include: { plans: true },
        })
      : await prisma.plan_variants.findFirst({
          where: {
            speed_mbps: speedMbps,
            duration_months: durationMonths,
            plans: { name: planName },
          },
          include: { plans: true },
        });

    if (!variant) {
      return NextResponse.json({ error: "Selected plan was not found" }, { status: 404 });
    }

    const token = createUploadToken();

    const result = await prisma.$transaction(async (tx) => {
      const connectionRequest = await tx.new_connection_requests.create({
        data: {
          plan_variant_id: variant.id,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          installation_address: address,
          city,
          state,
          pin_code: pinCode,
          landmark,
          notes,
          amount: variant.price,
          status: "UNDER_REVIEW",
          request_source: "ADMIN_CREATED",
          payment_mode: paymentMode,
          paid_at: paymentMode === "NOT_COLLECTED" ? null : new Date(),
        },
        select: {
          id: true,
          status: true,
          request_source: true,
          payment_mode: true,
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
          paid_at: true,
          created_at: true,
          updated_at: true,
        },
      });

      const documentUploadRequest = await tx.document_upload_requests.create({
        data: {
          token,
          new_connection_request_id: connectionRequest.id,
          upload_mode: uploadMode,
          required_documents: requiredDocuments,
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
        },
      });

      return { connectionRequest, documentUploadRequest };
    });

    const planText = `${variant.plans.name} ${variant.speed_mbps} Mbps for ${variant.duration_months} months`;
    let uploadUrl: string | null = null;

    if (uploadMode === "CUSTOMER_LINK" && sendLink) {
      uploadUrl = await sendKycUploadLinkEmail({
        req,
        customerName: name,
        customerEmail: email,
        planText,
        requiredDocuments,
        token,
        expiresAt,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        connection: {
          ...result.connectionRequest,
          amount: Number(result.connectionRequest.amount),
          paid_at: safeDate(result.connectionRequest.paid_at),
          created_at: result.connectionRequest.created_at.toISOString(),
          updated_at: result.connectionRequest.updated_at.toISOString(),
          plan: {
            id: variant.id,
            name: variant.plans.name,
            speed_mbps: variant.speed_mbps,
            duration_months: variant.duration_months,
            price: Number(variant.price),
          },
        },
        documentUploadRequest: {
          ...result.documentUploadRequest,
          expires_at: result.documentUploadRequest.expires_at.toISOString(),
          created_at: result.documentUploadRequest.created_at.toISOString(),
          updated_at: result.documentUploadRequest.updated_at.toISOString(),
        },
        uploadUrl,
        emailSent: Boolean(uploadUrl),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("api/admin/new-connections POST error:", err);
    return NextResponse.json({ error: "Failed to create admin connection request" }, { status: 500 });
  }
}
