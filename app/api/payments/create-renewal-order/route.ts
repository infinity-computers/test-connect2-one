import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { getAuthPayloadFromRequest } from "../../../../lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function POST(req: NextRequest) {
  const payload = getAuthPayloadFromRequest(req);
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const planVariantId =
    typeof body?.planVariantId === "string" ? body.planVariantId.trim() : "";

  if (!planVariantId) {
    return NextResponse.json(
      { error: "planVariantId is required" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planVariant = await prisma.plan_variants.findUnique({
      where: { id: planVariantId },
      include: { plans: true },
    });

    if (!planVariant) {
      return NextResponse.json(
        { error: "Plan variant not found" },
        { status: 404 },
      );
    }

    const latestSub = await prisma.subscriptions.findFirst({
      where: {
        user_id: user.id,
        status: "active",
      },
      orderBy: { end_date: "desc" },
    });

    const now = new Date();
    const startDate =
      latestSub && latestSub.end_date > now ? latestSub.end_date : now;
    const endDate = addMonths(startDate, planVariant.duration_months);

    const orderId = `order_${crypto.randomUUID().replaceAll("-", "")}`;

    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: user.id,
        plan_variant_id: planVariant.id,
        start_date: startDate,
        end_date: endDate,
        status: "active",
      },
    });

    const payment = await prisma.payments.create({
      data: {
        subscription_id: subscription.id,
        user_id: user.id,
        amount: planVariant.price,
        razorpay_order_id: orderId,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        order: {
          id: orderId,
          amount: Number(planVariant.price),
          currency: "INR",
        },
        subscriptionId: subscription.id,
        paymentId: payment.id,
        plan: {
          category: planVariant.plans.name,
          speed: planVariant.speed_mbps,
          durationMonths: planVariant.duration_months,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("payments/create-renewal-order error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
