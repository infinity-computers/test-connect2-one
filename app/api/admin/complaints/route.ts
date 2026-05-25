import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import { complaints_status } from "../../../../generated/prisma/enums";
import { ensureComplaintReminderScheduler } from "../../../../lib/complaint-reminder";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  ensureComplaintReminderScheduler();

  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status: status as complaints_status } : {};

    const complaints = await prisma.complaints.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        users: {
          select: { name: true, email: true, phone: true },
        },
        assigned_technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ complaints });
  } catch (err) {
    console.error("api/admin/complaints GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
