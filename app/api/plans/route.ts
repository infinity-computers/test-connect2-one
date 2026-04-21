import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = await prisma.plans.findMany({
      include: {
        plan_variants: {
          orderBy: [
            { speed_mbps: "asc" },
            { duration_months: "asc" },
          ],
        },
      },
    });

    return NextResponse.json({ plans });
  } catch (err) {
    console.error("api/plans GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}