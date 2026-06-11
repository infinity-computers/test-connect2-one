import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth-token";
import { subscriptions_status } from "../../../../../generated/prisma/enums";

export const runtime = "nodejs";

type UpdateSubscriptionBody = {
  planVariantId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  status?: unknown;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseDate(value: unknown): Date | null {
  const raw = cleanString(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSubscriptionStatus(value: string): value is subscriptions_status {
  return ["active", "expired", "cancelled"].includes(value);
}

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  return user?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: UpdateSubscriptionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planVariantId = cleanString(body.planVariantId);
  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);
  const status = cleanString(body.status);

  if (!planVariantId || !startDate || !endDate || !status) {
    return NextResponse.json(
      { error: "Plan, start date, end date, and status are required" },
      { status: 400 },
    );
  }

  if (!isSubscriptionStatus(status)) {
    return NextResponse.json({ error: "Invalid subscription status" }, { status: 400 });
  }

  if (endDate <= startDate) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }

  try {
    const existing = await prisma.subscriptions.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const planVariant = await prisma.plan_variants.findUnique({
      where: { id: planVariantId },
      select: { id: true },
    });

    if (!planVariant) {
      return NextResponse.json({ error: "Plan variant not found" }, { status: 404 });
    }

    if (status === "active") {
      const activeSubscription = await prisma.subscriptions.findFirst({
        where: {
          user_id: existing.user_id,
          status: "active",
          id: { not: id },
        },
        select: { id: true },
      });

      if (activeSubscription) {
        return NextResponse.json(
          { error: "This user already has an active subscription. Cancel or edit it before making another subscription active." },
          { status: 409 },
        );
      }
    }

    const subscription = await prisma.subscriptions.update({
      where: { id },
      data: {
        plan_variant_id: planVariantId,
        start_date: startDate,
        end_date: endDate,
        status,
      },
      include: {
        plan_variants: {
          include: { plans: true },
        },
      },
    });

    return NextResponse.json({ ok: true, subscription });
  } catch (err) {
    console.error("api/admin/subscriptions/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
