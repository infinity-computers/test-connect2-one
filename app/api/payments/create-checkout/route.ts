import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

type CheckoutBody = {
  subscriptionId?: string;
  planVariantId: string;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subscriptionId, planVariantId } = body;

  if (!planVariantId) {
    return NextResponse.json({ error: "planVariantId is required" }, { status: 400 });
  }

  try {
    const variant = await prisma.plan_variants.findUnique({
      where: { id: planVariantId },
      include: { plans: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Plan variant not found" }, { status: 404 });
    }

    const amount = Number(variant.price) * 100;

    let subscriptionIdToUse = subscriptionId;

    if (!subscriptionIdToUse) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + variant.duration_months);

      const newSubscription = await prisma.subscriptions.create({
        data: {
          user_id: user.userId,
          plan_variant_id: planVariantId,
          start_date: startDate,
          end_date: endDate,
          status: "expired",
        },
      });
      subscriptionIdToUse = newSubscription.id;
    } else {
      const subscription = await prisma.subscriptions.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription || subscription.user_id !== user.userId) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }
    }

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userId: user.userId,
        planVariantId,
        subscriptionId: subscriptionIdToUse,
      },
    });

    const payment = await prisma.payments.create({
      data: {
        subscription_id: subscriptionIdToUse,
        user_id: user.userId,
        amount: variant.price,
        razorpay_order_id: razorpayOrder.id,
        status: "pending",
      },
    });

    const paymentLink = await razorpay.paymentLink.create({
      amount,
      currency: "INR",
      accept_partial: false,
      description: `${variant.plans.name} - ${variant.speed_mbps} Mbps for ${variant.duration_months} months`,
      customer: {
        email: user.email,
        name: user.name || user.email,
      },
      notify: {
        email: true,
        sms: true,
      },
      notes: {
        paymentId: payment.id,
        userId: user.userId,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment-success?payment_id=${payment.id}`,
      callback_method: "get",
    });

    return NextResponse.json({
      ok: true,
      paymentLink: paymentLink.short_url,
      orderId: razorpayOrder.id,
      paymentId: payment.id,
    });
  } catch (err) {
    console.error("api/payments/create-checkout POST error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}