import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import { ticket_issue_type, ticket_status } from "../../../../generated/prisma/enums";
import { ensureTicketReminderScheduler } from "../../../../lib/ticket-reminder";

export const runtime = "nodejs";

type AdminCreateTicketBody = {
  issue_type?: string;
  description?: string;
  user_id?: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_email?: string;
  reporter_address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  assigned_technician_id?: string;
};

function generateTrackingCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TKT-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function createUniqueTrackingCode(): Promise<string> {
  while (true) {
    const trackingCode = generateTrackingCode();
    const existing = await prisma.tickets.findUnique({
      where: { tracking_code: trackingCode },
      select: { id: true },
    });
    if (!existing) return trackingCode;
  }
}

export async function GET(req: NextRequest) {
  ensureTicketReminderScheduler();

  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status: status as ticket_status } : {};

    const tickets = await prisma.tickets.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assigned_technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("api/admin/tickets GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  ensureTicketReminderScheduler();

  const user = await getCurrentUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AdminCreateTicketBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const issueType = typeof body.issue_type === "string" ? body.issue_type : "";
  if (!issueType) {
    return NextResponse.json({ error: "issue_type is required" }, { status: 400 });
  }

  try {
    if (body.assigned_technician_id) {
      const technician = await prisma.users.findFirst({
        where: { id: body.assigned_technician_id, role: "TECHNICIAN" },
        select: { id: true },
      });

      if (!technician) {
        return NextResponse.json({ error: "Assigned technician not found" }, { status: 404 });
      }
    }

    const trackingCode = await createUniqueTrackingCode();

    const ticket = await prisma.tickets.create({
      data: {
        tracking_code: trackingCode,
        issue_type: issueType as ticket_issue_type,
        explicit_description: body.description || null,
        user_id: body.user_id || null,
        reporter_name: body.reporter_name || null,
        reporter_phone: body.reporter_phone || null,
        reporter_email: body.reporter_email || null,
        reporter_address: body.reporter_address || null,
        city: body.city || null,
        state: body.state || null,
        pin_code: body.pin_code || null,
        source: "ADMIN",
        status: "OPEN",
        assigned_technician_id: body.assigned_technician_id || null,
        assigned_at: body.assigned_technician_id ? new Date() : null,
      },
      include: {
        users: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assigned_technician: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ ok: true, ticket }, { status: 201 });
  } catch (err) {
    console.error("api/admin/tickets POST error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
