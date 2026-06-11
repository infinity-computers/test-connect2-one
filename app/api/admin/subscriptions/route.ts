import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import { subscriptions_status } from "../../../../generated/prisma/enums";

export const runtime = "nodejs";

type SubscriptionBody = {
  userId?: unknown;
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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();

  try {
    const [users, plans, subscriptions] = await Promise.all([
      prisma.users.findMany({
        where: { role: "USER" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
      }),
      prisma.plans.findMany({
        include: {
          plan_variants: {
            orderBy: [{ speed_mbps: "asc" }, { duration_months: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      }),
      userId
        ? prisma.subscriptions.findMany({
            where: { user_id: userId },
            include: {
              plan_variants: {
                include: { plans: true },
              },
            },
            orderBy: { created_at: "desc" },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ users, plans, subscriptions });
  } catch (err) {
    console.error("api/admin/subscriptions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SubscriptionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = cleanString(body.userId);
  const planVariantId = cleanString(body.planVariantId);
  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);
  const status = cleanString(body.status) || "active";

  if (!userId || !planVariantId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "User, plan, start date, and end date are required" },
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
    const [targetUser, planVariant] = await Promise.all([
      prisma.users.findFirst({ where: { id: userId, role: "USER" }, select: { id: true } }),
      prisma.plan_variants.findUnique({ where: { id: planVariantId }, select: { id: true } }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!planVariant) {
      return NextResponse.json({ error: "Plan variant not found" }, { status: 404 });
    }

    if (status === "active") {
      const activeSubscription = await prisma.subscriptions.findFirst({
        where: { user_id: userId, status: "active" },
        select: { id: true },
      });

      if (activeSubscription) {
        return NextResponse.json(
          { error: "This user already has an active subscription. Cancel or edit it before adding a new active subscription." },
          { status: 409 },
        );
      }
    }

    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: userId,
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

    return NextResponse.json({ ok: true, subscription }, { status: 201 });
  } catch (err) {
    console.error("api/admin/subscriptions POST error:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
