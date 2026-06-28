import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewBody = {
  action?: unknown;
  startDate?: unknown;
  start_date?: unknown;
  rejectionReason?: unknown;
  rejection_reason?: unknown;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalDate(value: unknown): Date {
  const raw = cleanString(value);
  if (!raw) return new Date();

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function addMonths(date: Date, months: number): Date {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function getConfirmedDocumentTypes(files: { document_type: string }[]) {
  return new Set(files.map((file) => file.document_type));
}

function isKycComplete(request: {
  status: string;
  required_documents: string[];
  files: { document_type: string }[];
}) {
  if (request.status !== "SUBMITTED") return false;

  const confirmedDocumentTypes = getConfirmedDocumentTypes(request.files);
  return request.required_documents.every((documentType) => confirmedDocumentTypes.has(documentType));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;
  const safeId = typeof id === "string" ? id.trim() : "";

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!safeId) {
    return NextResponse.json({ error: "New connection request id is required" }, { status: 400 });
  }

  let body: ReviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = cleanString(body.action).toUpperCase();
  const rejectionReason = cleanString(body.rejectionReason ?? body.rejection_reason);
  const startDate = parseOptionalDate(body.startDate ?? body.start_date);

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
  }

  if (action === "REJECT" && !rejectionReason) {
    return NextResponse.json({ error: "rejectionReason is required when rejecting" }, { status: 400 });
  }

  try {
    const connectionRequest = await prisma.new_connection_requests.findUnique({
      where: { id: safeId },
      include: {
        plan_variants: { include: { plans: true } },
        document_upload_requests: {
          orderBy: { created_at: "desc" },
          include: {
            files: {
              select: { id: true, document_type: true },
            },
          },
        },
      },
    });

    if (!connectionRequest) {
      return NextResponse.json({ error: "New connection request not found" }, { status: 404 });
    }

    if (["ACTIVATED", "REJECTED", "CANCELLED", "REFUNDED"].includes(connectionRequest.status)) {
      return NextResponse.json({ error: "This connection request has already been finalized" }, { status: 409 });
    }

    if (action === "REJECT") {
      const rejectedRequest = await prisma.$transaction(async (tx) => {
        await tx.document_upload_requests.updateMany({
          where: {
            new_connection_request_id: connectionRequest.id,
            status: "PENDING",
          },
          data: { status: "CANCELLED" },
        });

        return tx.new_connection_requests.update({
          where: { id: connectionRequest.id },
          data: {
            status: "REJECTED",
            reviewed_by_id: user.userId,
            reviewed_at: new Date(),
            rejection_reason: rejectionReason,
          },
          select: {
            id: true,
            status: true,
            reviewed_by_id: true,
            reviewed_at: true,
            rejection_reason: true,
          },
        });
      });

      return NextResponse.json({
        ok: true,
        request: {
          id: rejectedRequest.id,
          status: rejectedRequest.status,
          reviewedById: rejectedRequest.reviewed_by_id,
          reviewedAt: rejectedRequest.reviewed_at?.toISOString() ?? null,
          rejectionReason: rejectedRequest.rejection_reason,
        },
      });
    }

    const completedKycRequest = connectionRequest.document_upload_requests.find(isKycComplete);
    if (!completedKycRequest) {
      return NextResponse.json(
        { error: "KYC documents must be fully submitted before approval" },
        { status: 409 },
      );
    }

    const endDate = addMonths(startDate, connectionRequest.plan_variants.duration_months);

    const result = await prisma.$transaction(async (tx) => {
      const conflictingStaffUser = await tx.users.findFirst({
        where: {
          role: { in: ["ADMIN", "TECHNICIAN"] },
          OR: [
            { email: connectionRequest.customer_email },
            { phone: connectionRequest.customer_phone },
          ],
        },
        select: { id: true },
      });

      if (conflictingStaffUser) {
        throw new Error("CUSTOMER_CONTACT_CONFLICT");
      }

      const customerUser =
        (await tx.users.findFirst({
          where: {
            role: "USER",
            OR: [
              { email: connectionRequest.customer_email },
              { phone: connectionRequest.customer_phone },
            ],
          },
          select: { id: true, name: true, email: true, phone: true, role: true },
        })) ??
        (await tx.users.create({
          data: {
            name: connectionRequest.customer_name,
            email: connectionRequest.customer_email,
            phone: connectionRequest.customer_phone,
            role: "USER",
            auth_type: "PASSWORD",
          },
          select: { id: true, name: true, email: true, phone: true, role: true },
        }));

      const activeSubscription = await tx.subscriptions.findFirst({
        where: {
          user_id: customerUser.id,
          status: "active",
        },
        select: { id: true },
      });

      if (activeSubscription) {
        throw new Error("ACTIVE_SUBSCRIPTION_EXISTS");
      }

      const subscription = await tx.subscriptions.create({
        data: {
          user_id: customerUser.id,
          plan_variant_id: connectionRequest.plan_variant_id,
          start_date: startDate,
          end_date: endDate,
          status: "active",
        },
        include: {
          plan_variants: {
            include: { plans: true },
          },
        },
      });

      const updatedRequest = await tx.new_connection_requests.update({
        where: { id: connectionRequest.id },
        data: {
          user_id: customerUser.id,
          status: "ACTIVATED",
          reviewed_by_id: user.userId,
          reviewed_at: new Date(),
          rejection_reason: null,
        },
        select: {
          id: true,
          status: true,
          user_id: true,
          reviewed_by_id: true,
          reviewed_at: true,
        },
      });

      return { customerUser, subscription, updatedRequest };
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: result.updatedRequest.id,
        status: result.updatedRequest.status,
        userId: result.updatedRequest.user_id,
        reviewedById: result.updatedRequest.reviewed_by_id,
        reviewedAt: result.updatedRequest.reviewed_at?.toISOString() ?? null,
      },
      user: result.customerUser,
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        startDate: result.subscription.start_date.toISOString(),
        endDate: result.subscription.end_date.toISOString(),
        plan: {
          name: result.subscription.plan_variants.plans.name,
          speedMbps: result.subscription.plan_variants.speed_mbps,
          durationMonths: result.subscription.plan_variants.duration_months,
        },
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CUSTOMER_CONTACT_CONFLICT") {
      return NextResponse.json({ error: "Customer email or phone is already used by staff" }, { status: 409 });
    }

    if (err instanceof Error && err.message === "ACTIVE_SUBSCRIPTION_EXISTS") {
      return NextResponse.json({ error: "Customer already has an active subscription" }, { status: 409 });
    }

    console.error("api/admin/new-connections/[id]/review POST error:", err);
    return NextResponse.json({ error: "Failed to review connection request" }, { status: 500 });
  }
}
