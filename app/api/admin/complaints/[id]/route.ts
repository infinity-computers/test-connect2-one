import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth-token";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const safeComplaint = {
      ...complaint,
      created_at: safeDate(complaint.created_at),
      updated_at: safeDate(complaint.updated_at),
      tracking_code: complaint.tracking_code,
    };

    return NextResponse.json({ complaint: safeComplaint });
  } catch (err) {
    console.error("api/admin/complaints/[id] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch complaint" }, { status: 500 });
  }
}

type UpdateBody = {
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;

  if (!status || !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) {
    return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
  }

  if (status === "RESOLVED" && user.role === "TECHNICIAN") {
    const approvedOtp = await prisma.otp_challenges.findFirst({
      where: {
        complaint_id: id,
        purpose: "COMPLAINT_RESOLVE",
        consumed_at: { not: null },
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });

    if (!approvedOtp) {
      return NextResponse.json(
        { error: "OTP verification required before resolving this complaint" },
        { status: 403 }
      );
    }
  }

  try {
    const complaint = await prisma.complaints.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true, complaint });
  } catch (err) {
    console.error("api/admin/complaints/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
