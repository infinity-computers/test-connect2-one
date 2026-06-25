import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";

export const runtime = "nodejs";

function safeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscriptionInclude = {
      plan_variants: {
        include: {
          plans: true,
        },
      },
    } as const;

    const now = new Date();
    const subscription =
      (await prisma.subscriptions.findFirst({
        where: {
          user_id: user.userId,
          status: "active",
          start_date: { lte: now },
          end_date: { gte: now },
        },
        orderBy: { end_date: "desc" },
        include: subscriptionInclude,
      })) ??
      (await prisma.subscriptions.findFirst({
        where: {
          user_id: user.userId,
          status: "active",
          start_date: { gt: now },
        },
        orderBy: { start_date: "asc" },
        include: subscriptionInclude,
      })) ??
      (await prisma.subscriptions.findFirst({
        where: {
          user_id: user.userId,
          status: "active",
        },
        orderBy: { end_date: "desc" },
        include: subscriptionInclude,
      }));

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    const safeSubscription = {
      ...subscription,
      start_date: safeDate(subscription.start_date),
      end_date: safeDate(subscription.end_date),
      created_at: safeDate(subscription.created_at),
      updated_at: safeDate(subscription.updated_at),
    };

    const payments = await prisma.payments.findMany({
      where: { subscription_id: subscription.id },
      orderBy: { created_at: "desc" },
    });

    const safePayments = payments.map(p => ({
      ...p,
      payment_date: safeDate(p.payment_date),
      created_at: safeDate(p.created_at),
      updated_at: safeDate(p.updated_at),
    }));

    return NextResponse.json({ 
      subscription: {
        ...safeSubscription,
        payments: safePayments,
      }
    });
  } catch (err) {
    console.error("api/subscriptions/me GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
