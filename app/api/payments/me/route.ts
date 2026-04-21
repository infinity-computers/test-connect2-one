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
    const payments = await prisma.payments.findMany({
      where: { user_id: user.userId },
      orderBy: { created_at: "desc" },
      include: {
        subscriptions: {
          include: {
            plan_variants: {
              include: {
                plans: true,
              },
            },
          },
        },
      },
    });

    const safePayments = payments.map(p => ({
      ...p,
      payment_date: safeDate(p.payment_date),
      created_at: safeDate(p.created_at),
      updated_at: safeDate(p.updated_at),
    }));

    return NextResponse.json({ payments: safePayments });
  } catch (err) {
    console.error("api/payments/me GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
