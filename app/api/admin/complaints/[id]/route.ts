import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/auth-token";
import { complaints_status } from "../../../../../generated/prisma/enums";
import { ensureComplaintReminderScheduler } from "../../../../../lib/complaint-reminder";

export const runtime = "nodejs";

const VALID_STATUSES: complaints_status[] = [
  "PENDING_APPROVAL",
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

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
  ensureComplaintReminderScheduler();

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
        assigned_technician: {
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
      assigned_at: safeDate(complaint.assigned_at),
      last_reminder_sent_at: safeDate(complaint.last_reminder_sent_at),
      tracking_code: complaint.tracking_code,
    };

    return NextResponse.json({ complaint: safeComplaint });
  } catch (err) {
    console.error("api/admin/complaints/[id] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch complaint" }, { status: 500 });
  }
}

type UpdateBody = {
  status?: complaints_status;
  assigned_technician_id?: string | null;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureComplaintReminderScheduler();

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
  const hasStatus = typeof status !== "undefined";
  const hasAssignment = Object.prototype.hasOwnProperty.call(body, "assigned_technician_id");

  if (!hasStatus && !hasAssignment) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (hasStatus && !VALID_STATUSES.includes(status as complaints_status)) {
    return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
  }

  if (user.role !== "ADMIN" && hasAssignment) {
    return NextResponse.json({ error: "Only admin can assign technicians" }, { status: 403 });
  }

  if (user.role !== "ADMIN" && hasStatus && (status === "PENDING_APPROVAL" || status === "REJECTED")) {
    return NextResponse.json({ error: "Only admin can set this status" }, { status: 403 });
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
    const existing = await prisma.complaints.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        assigned_at: true,
        assigned_technician_id: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (user.role === "TECHNICIAN") {
      if (hasStatus && status === "IN_PROGRESS") {
        if (existing.status !== "OPEN") {
          return NextResponse.json({ error: "Only open complaints can be started" }, { status: 400 });
        }

        if (existing.assigned_technician_id && existing.assigned_technician_id !== user.userId) {
          return NextResponse.json({ error: "This complaint is assigned to another technician" }, { status: 403 });
        }
      }

      if (hasStatus && status === "RESOLVED") {
        if (existing.assigned_technician_id && existing.assigned_technician_id !== user.userId) {
          return NextResponse.json({ error: "You can only resolve your assigned complaint" }, { status: 403 });
        }
      }
    }

    const updateData: {
      status?: complaints_status;
      assigned_technician_id?: string | null;
      assigned_at?: Date | null;
      reminder_enabled?: boolean;
      last_reminder_sent_at?: Date | null;
    } = {};

    if (hasAssignment) {
      const nextAssignedId = body.assigned_technician_id ?? null;

      if (nextAssignedId) {
        const technician = await prisma.users.findFirst({
          where: { id: nextAssignedId, role: "TECHNICIAN" },
          select: { id: true },
        });

        if (!technician) {
          return NextResponse.json({ error: "Technician not found" }, { status: 404 });
        }
      }

      updateData.assigned_technician_id = nextAssignedId;
      updateData.assigned_at = nextAssignedId ? existing.assigned_at ?? new Date() : null;

      if (!nextAssignedId) {
        updateData.reminder_enabled = false;
        updateData.last_reminder_sent_at = null;
      }
    }

    if (hasStatus) {
      updateData.status = status;

      if (status === "IN_PROGRESS") {
        if (user.role === "TECHNICIAN") {
          updateData.assigned_technician_id = user.userId;
          updateData.assigned_at = existing.assigned_at ?? new Date();
        } else {
          updateData.assigned_at = existing.assigned_at ?? new Date();
        }
        updateData.reminder_enabled = true;
        updateData.last_reminder_sent_at = null;
      } else if (status === "RESOLVED") {
        updateData.reminder_enabled = false;
      } else if (status === "OPEN") {
        updateData.reminder_enabled = false;
        updateData.last_reminder_sent_at = null;
      } else if (status === "PENDING_APPROVAL" || status === "REJECTED") {
        updateData.assigned_technician_id = null;
        updateData.assigned_at = null;
        updateData.reminder_enabled = false;
        updateData.last_reminder_sent_at = null;
      }
    }

    const complaint = await prisma.complaints.update({
      where: { id },
      data: updateData,
      include: {
        assigned_technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ ok: true, complaint });
  } catch (err) {
    console.error("api/admin/complaints/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
