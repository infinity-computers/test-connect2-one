import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  const orderId = searchParams.get("orderId");

  if (!requestId || !orderId) {
    return NextResponse.json({ error: "requestId and orderId are required" }, { status: 400 });
  }

  try {
    const request = await prisma.new_connection_requests.findFirst({
      where: { id: requestId, cashfree_order_id: orderId },
      include: {
        tickets: { select: { tracking_code: true } },
        plan_variants: { include: { plans: true } },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({
      request: {
        id: request.id,
        status: request.status,
        orderId: request.cashfree_order_id,
        trackingCode: request.tickets?.tracking_code || null,
        paidAt: request.paid_at?.toISOString() || null,
        amount: Number(request.amount),
        plan: {
          name: request.plan_variants.plans.name,
          speedMbps: request.plan_variants.speed_mbps,
          durationMonths: request.plan_variants.duration_months,
        },
      },
    });
  } catch (err) {
    console.error("api/new-connections/status error:", err);
    return NextResponse.json({ error: "Failed to fetch request status" }, { status: 500 });
  }
}
