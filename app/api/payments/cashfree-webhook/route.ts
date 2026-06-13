import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyCashfreeWebhookSignature } from "../../../../lib/cashfree";
import { sendPlainEmail } from "../../../../lib/email";
import { createUniqueTicketTrackingCode } from "../../../../lib/tracking-code";

export const runtime = "nodejs";

type CashfreeWebhookPayload = {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_status?: string;
    };
    payment?: {
      cf_payment_id?: string | number;
      payment_status?: string;
    };
  };
};

function normalizeStatus(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase() : "";
}

function getOrderId(payload: CashfreeWebhookPayload): string | null {
  return payload.data?.order?.order_id || null;
}

function getPaymentId(payload: CashfreeWebhookPayload): string | null {
  const value = payload.data?.payment?.cf_payment_id;
  if (typeof value === "number") return String(value);
  return typeof value === "string" ? value : null;
}

function isSuccessEvent(payload: CashfreeWebhookPayload): boolean {
  const type = normalizeStatus(payload.type);
  const paymentStatus = normalizeStatus(payload.data?.payment?.payment_status);
  const orderStatus = normalizeStatus(payload.data?.order?.order_status);
  return type.includes("SUCCESS") || paymentStatus === "SUCCESS" || orderStatus === "PAID";
}

function isFailedEvent(payload: CashfreeWebhookPayload): boolean {
  const type = normalizeStatus(payload.type);
  const paymentStatus = normalizeStatus(payload.data?.payment?.payment_status);
  return type.includes("FAILED") || paymentStatus === "FAILED";
}

function isDroppedEvent(payload: CashfreeWebhookPayload): boolean {
  const type = normalizeStatus(payload.type);
  const paymentStatus = normalizeStatus(payload.data?.payment?.payment_status);
  return type.includes("DROPPED") || paymentStatus === "USER_DROPPED";
}

async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.users.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  return [...new Set(admins.map((admin) => admin.email?.trim()).filter((email): email is string => Boolean(email)))];
}

async function ensureLinkedTicket(requestId: string): Promise<string | null> {
  const existing = await prisma.new_connection_requests.findUnique({
    where: { id: requestId },
    select: { ticket_id: true },
  });

  if (!existing || existing.ticket_id) return existing?.ticket_id || null;

  const request = await prisma.new_connection_requests.findUnique({
    where: { id: requestId },
    include: { plan_variants: { include: { plans: true } } },
  });

  if (!request) return null;

  const trackingCode = await createUniqueTicketTrackingCode();
  const ticket = await prisma.tickets.create({
    data: {
      tracking_code: trackingCode,
      user_id: request.user_id,
      source: request.user_id ? "AUTHENTICATED" : "GUEST",
      reporter_name: request.customer_name,
      reporter_phone: request.customer_phone,
      reporter_email: request.customer_email,
      reporter_address: request.installation_address,
      city: request.city,
      state: request.state,
      pin_code: request.pin_code,
      issue_type: "New_connection_delay",
      explicit_description: [
        "New broadband connection request paid through Cashfree.",
        `Plan: ${request.plan_variants.plans.name} ${request.plan_variants.speed_mbps} Mbps for ${request.plan_variants.duration_months} months`,
        `Amount Paid: Rs. ${Number(request.amount).toLocaleString("en-IN")}`,
        request.landmark ? `Landmark: ${request.landmark}` : null,
        request.notes ? `Notes: ${request.notes}` : null,
        "Installation charges will be collected at the time of installation.",
      ].filter(Boolean).join("\n"),
      status: "OPEN",
    },
    select: { id: true },
  });

  await prisma.new_connection_requests.update({
    where: { id: request.id },
    data: { ticket_id: ticket.id },
  });

  return ticket.id;
}

async function sendNewConnectionEmails(requestId: string) {
  const request = await prisma.new_connection_requests.findUnique({
    where: { id: requestId },
    include: {
      tickets: { select: { tracking_code: true } },
      plan_variants: { include: { plans: true } },
    },
  });

  if (!request) return;

  const adminEmails = await getAdminEmails();
  const trackingCode = request.tickets?.tracking_code || "Pending";
  const planText = `${request.plan_variants.plans.name} ${request.plan_variants.speed_mbps} Mbps for ${request.plan_variants.duration_months} months`;

  if (!request.customer_notified_at) {
    await sendPlainEmail({
      to: request.customer_email,
      subject: `Payment received - New connection request ${trackingCode}`,
      text: [
        `Hi ${request.customer_name},`,
        "",
        "We have received your payment for a new broadband connection request.",
        `Tracking ID: ${trackingCode}`,
        `Plan: ${planText}`,
        `Amount Paid: Rs. ${Number(request.amount).toLocaleString("en-IN")}`,
        "Installation charges will be collected at the time of installation.",
        "",
        "Our team will contact you shortly for installation.",
        "",
        "Regards,",
        "Connect One Networks",
      ].join("\n"),
    });

    await prisma.new_connection_requests.update({
      where: { id: request.id },
      data: { customer_notified_at: new Date() },
    });
  }

  if (!request.admin_notified_at && adminEmails.length > 0) {
    await sendPlainEmail({
      to: adminEmails[0],
      bcc: adminEmails.slice(1),
      subject: `New paid connection request - ${trackingCode}`,
      text: [
        "New paid connection request received.",
        "",
        `Tracking ID: ${trackingCode}`,
        `Cashfree Order ID: ${request.cashfree_order_id}`,
        `Customer: ${request.customer_name}`,
        `Phone: ${request.customer_phone}`,
        `Email: ${request.customer_email}`,
        `Address: ${request.installation_address}`,
        `City: ${request.city}`,
        `State: ${request.state}`,
        `Pin Code: ${request.pin_code}`,
        request.landmark ? `Landmark: ${request.landmark}` : null,
        `Plan: ${planText}`,
        `Amount Paid: Rs. ${Number(request.amount).toLocaleString("en-IN")}`,
        "Installation charges will be collected at the time of installation.",
      ].filter(Boolean).join("\n"),
    });

    await prisma.new_connection_requests.update({
      where: { id: request.id },
      data: { admin_notified_at: new Date() },
    });
  }
}

export async function POST(req: NextRequest) {
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signature = req.headers.get("x-webhook-signature");
  const rawBody = await req.text();

  if (!timestamp || !signature) {
    return NextResponse.json({ error: "Missing webhook signature headers" }, { status: 400 });
  }

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const orderId = getOrderId(payload);
  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "Missing order id" }, { status: 200 });
  }

  try {
    const request = await prisma.new_connection_requests.findUnique({
      where: { cashfree_order_id: orderId },
      select: { id: true, status: true },
    });

    if (!request) {
      return NextResponse.json({ ok: true, ignored: true, reason: "Request not found" }, { status: 200 });
    }

    if (isSuccessEvent(payload)) {
      await prisma.new_connection_requests.update({
        where: { id: request.id },
        data: {
          status: "PAID",
          cashfree_payment_id: getPaymentId(payload),
          paid_at: new Date(),
        },
      });

      await ensureLinkedTicket(request.id);
      await sendNewConnectionEmails(request.id).catch((err) => {
        console.error("cashfree webhook email send failed:", err);
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isFailedEvent(payload)) {
      await prisma.new_connection_requests.update({
        where: { id: request.id },
        data: {
          status: "PAYMENT_FAILED",
          cashfree_payment_id: getPaymentId(payload),
        },
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (isDroppedEvent(payload)) {
      await prisma.new_connection_requests.update({
        where: { id: request.id },
        data: { status: "PAYMENT_DROPPED" },
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  } catch (err) {
    console.error("cashfree webhook error:", err);
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Cashfree webhook endpoint is reachable" });
}
