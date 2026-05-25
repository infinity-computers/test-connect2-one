import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth-token";
import { ensureComplaintReminderScheduler } from "../../../lib/complaint-reminder";
import { complaints_issue_type } from "../../../generated/prisma/enums";

export const runtime = "nodejs";

type ComplaintBody = {
  issue_type: string;
  description?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
};

function generateTrackingCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "C2O-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function createUniqueTrackingCode(): Promise<string> {
  while (true) {
    const trackingCode = generateTrackingCode();
    const existing = await prisma.complaints.findUnique({
      where: { tracking_code: trackingCode },
      select: { id: true },
    });

    if (!existing) return trackingCode;
  }
}

function createSendmailTransport() {
  return nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
}

async function sendComplaintEmails(options: {
  complaintId: string;
  trackingCode: string;
  issueType: string;
  description?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  adminEmails: string[];
}) {
  const transporter = createSendmailTransport();
  const from = "no-reply@connect2one.in";

  const customerText = [
    "Hi,",
    "",
    "We have received your complaint.",
    `Complaint ID: ${options.complaintId}`,
    `Tracking Code: ${options.trackingCode}`,
    `Issue Type: ${options.issueType.replace(/_/g, " ")}`,
    options.description ? `Description: ${options.description}` : null,
    "",
    "You can use the complaint ID above to track or follow up on this issue.",
    "",
    "Regards,",
    "Connect One Networks",
  ]
    .filter(Boolean)
    .join("\n");

  const careText = [
    "New complaint received",
    "",
    `Complaint ID: ${options.complaintId}`,
    `Tracking Code: ${options.trackingCode}`,
    `Customer Name: ${options.customerName}`,
    `Customer Email: ${options.customerEmail}`,
    options.customerPhone ? `Customer Phone: ${options.customerPhone}` : null,
    options.customerAddress ? `Address: ${options.customerAddress}` : null,
    options.city ? `City: ${options.city}` : null,
    options.state ? `State: ${options.state}` : null,
    options.pinCode ? `Pin Code: ${options.pinCode}` : null,
    `Issue Type: ${options.issueType.replace(/_/g, " ")}`,
    options.description ? `Description: ${options.description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([
    transporter.sendMail({
      from,
      to: options.customerEmail,
      subject: `Complaint Received - ${options.complaintId}`,
      text: customerText,
    }),
    transporter.sendMail({
      from,
      to: options.adminEmails[0] || options.customerEmail,
      bcc: options.adminEmails.slice(1),
      subject: `New Complaint - ${options.complaintId}`,
      text: careText,
    }),
  ]);
}

export async function GET(req: NextRequest) {
  ensureComplaintReminderScheduler();
  const user = await getCurrentUser(req);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complaints = await prisma.complaints.findMany({
      where: user.role === "ADMIN" || user.role === "TECHNICIAN" 
        ? {} 
        : { user_id: user.userId },
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
    console.error("api/complaints GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  let body: ComplaintBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { issue_type, description, name, phone, email, address, city, state, pin_code } = body;

  if (!issue_type) {
    return NextResponse.json({ error: "Issue type is required" }, { status: 400 });
  }

  try {
    if (user) {
      const trackingCode = await createUniqueTrackingCode();
      const complaint = await prisma.complaints.create({
        data: {
          tracking_code: trackingCode,
          user_id: user.userId,
          source: "AUTHENTICATED",
          issue_type: issue_type as complaints_issue_type,
          explicit_description: description || null,
        },
      });

      const adminUsers = await prisma.users.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const adminEmails = [...new Set(adminUsers.map((admin) => admin.email).filter((email): email is string => typeof email === "string" && email.length > 0))];

      sendComplaintEmails({
        complaintId: complaint.id,
        trackingCode,
        issueType: issue_type,
        description: description || null,
        customerName: user.name || user.email,
        customerEmail: user.email,
        adminEmails,
      }).catch((err) => {
        console.error("api/complaints email error:", err);
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id, trackingCode });
    } else {
      if (!name || !phone || !email || !address || !city || !state || !pin_code) {
        return NextResponse.json(
          { error: "Name, phone, email, address, city, state, and pin_code are required for guest complaints" },
          { status: 400 }
        );
      }

      const trackingCode = await createUniqueTrackingCode();
      const complaint = await prisma.complaints.create({
        data: {
          tracking_code: trackingCode,
          source: "GUEST",
          reporter_name: name,
          reporter_phone: phone,
          reporter_email: email,
          reporter_address: address,
          issue_type: issue_type as complaints_issue_type,
          explicit_description: description || null,
          city: city || null,
          state: state || null,
          pin_code: pin_code || null,
        },
      });

      const adminUsers = await prisma.users.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const adminEmails = [...new Set(adminUsers.map((admin) => admin.email).filter((email): email is string => typeof email === "string" && email.length > 0))];

      sendComplaintEmails({
        complaintId: complaint.id,
        trackingCode,
        issueType: issue_type,
        description: description || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        city: city || null,
        state: state || null,
        pinCode: pin_code || null,
        adminEmails,
      }).catch((err) => {
        console.error("api/complaints email error:", err);
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id, trackingCode });
    }
  } catch (err) {
    console.error("api/complaints POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
