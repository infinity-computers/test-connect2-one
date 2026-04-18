import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  status?: string;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(signature, "utf8"),
  );
}

async function findPayment(orderId?: string, paymentId?: string) {
  if (orderId) {
    const byOrder = await prisma.payments.findUnique({
      where: { razorpay_order_id: orderId },
    });
    if (byOrder) return byOrder;
  }

  if (paymentId) {
    const byPayment = await prisma.payments.findFirst({
      where: { razorpay_payment_id: paymentId },
    });
    if (byPayment) return byPayment;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is missing" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;
  const paymentId = paymentEntity?.id;
  const orderId = paymentEntity?.order_id;

  if (!event || !paymentEntity) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  try {
    const paymentRecord = await findPayment(orderId, paymentId);

    if (!paymentRecord) {
      return NextResponse.json(
        { ok: true, ignored: true, reason: "Payment record not found" },
        { status: 200 },
      );
    }

    if (event === "payment.captured") {
      if (paymentRecord.status !== "success") {
        await prisma.payments.update({
          where: { id: paymentRecord.id },
          data: {
            status: "success",
            razorpay_payment_id: paymentId ?? paymentRecord.razorpay_payment_id,
            payment_date: new Date(),
          },
        });

        await prisma.subscriptions.update({
          where: { id: paymentRecord.subscription_id },
          data: { status: "active" },
        });
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (event === "payment.failed") {
      if (paymentRecord.status !== "failed") {
        await prisma.payments.update({
          where: { id: paymentRecord.id },
          data: {
            status: "failed",
            razorpay_payment_id: paymentId ?? paymentRecord.razorpay_payment_id,
          },
        });
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (event === "payment.authorized") {
      return NextResponse.json({ ok: true, received: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  } catch (err) {
    console.error("razorpay-webhook error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
