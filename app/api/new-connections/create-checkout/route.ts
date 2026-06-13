import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import { createCashfreeOrder, getCashfreeCheckoutMode } from "../../../../lib/cashfree";

export const runtime = "nodejs";

type NewConnectionCheckoutBody = {
  planName?: string;
  speedMbps?: number;
  durationMonths?: number;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  landmark?: string;
  notes?: string;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createOrderId(): string {
  return `C2O_NC_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function getAppUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (user) {
    return NextResponse.json(
      { error: "New connection checkout is only available for new customers. Please use renewal or upgrade options from your dashboard." },
      { status: 403 },
    );
  }

  let body: NewConnectionCheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const planName = cleanString(body.planName);
  const speedMbps = Number(body.speedMbps);
  const durationMonths = Number(body.durationMonths);
  const name = cleanString(body.name);
  const phone = cleanString(body.phone);
  const email = cleanString(body.email).toLowerCase();
  const address = cleanString(body.address);
  const city = cleanString(body.city);
  const state = cleanString(body.state);
  const pinCode = cleanString(body.pinCode);
  const landmark = cleanString(body.landmark) || null;
  const notes = cleanString(body.notes) || null;

  if (!planName || !speedMbps || !durationMonths) {
    return NextResponse.json({ error: "Valid plan, speed, and duration are required" }, { status: 400 });
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

  try {
    const variant = await prisma.plan_variants.findFirst({
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

    const orderId = createOrderId();
    const amount = Number(variant.price);
    const appUrl = getAppUrl(req);

    const request = await prisma.new_connection_requests.create({
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
        status: "PENDING_PAYMENT",
        cashfree_order_id: orderId,
      },
    });

    const cashfreeOrder = await createCashfreeOrder({
      orderId,
      amount,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      returnUrl: `${appUrl}/payment-success?type=new_connection&request_id=${request.id}&order_id=${orderId}`,
      notifyUrl: process.env.CASHFREE_NOTIFY_URL,
      note: `New connection: ${variant.plans.name} ${variant.speed_mbps} Mbps ${variant.duration_months} months`,
    });

    if (!cashfreeOrder.payment_session_id) {
      throw new Error("Cashfree did not return a payment session");
    }

    await prisma.new_connection_requests.update({
      where: { id: request.id },
      data: { cashfree_payment_session_id: cashfreeOrder.payment_session_id },
    });

    return NextResponse.json({
      ok: true,
      requestId: request.id,
      orderId,
      paymentSessionId: cashfreeOrder.payment_session_id,
      mode: getCashfreeCheckoutMode(),
    });
  } catch (err) {
    console.error("api/new-connections/create-checkout error:", err);
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 });
  }
}
