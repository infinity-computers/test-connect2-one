import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";

export const runtime = "nodejs";

function safeDate(value: Date | null): string | null {
  return value ? value.toISOString() : null;
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
