import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth-token";
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

function createSendmailTransport() {
  return nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
}

async function sendComplaintEmails(options: {
  complaintId: string;
  issueType: string;
  description?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
}) {
  const transporter = createSendmailTransport();
  const from = "no-reply@connect2one.in";
  const careEmail = "care@connect2one.in";

  const customerText = [
    "Hi,",
    "",
    "We have received your complaint.",
    `Complaint ID: ${options.complaintId}`,
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
      to: careEmail,
      subject: `New Complaint - ${options.complaintId}`,
      text: careText,
    }),
  ]);
}

export async function GET(req: NextRequest) {
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
      const complaint = await prisma.complaints.create({
        data: {
          user_id: user.userId,
          source: "AUTHENTICATED",
          issue_type: issue_type as complaints_issue_type,
          explicit_description: description || null,
        },
      });

      sendComplaintEmails({
        complaintId: complaint.id,
        issueType: issue_type,
        description: description || null,
        customerName: user.name || user.email,
        customerEmail: user.email,
      }).catch((err) => {
        console.error("api/complaints email error:", err);
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id });
    } else {
      if (!name || !phone || !email || !address || !city || !state || !pin_code) {
        return NextResponse.json(
          { error: "Name, phone, email, address, city, state, and pin_code are required for guest complaints" },
          { status: 400 }
        );
      }

      const complaint = await prisma.complaints.create({
        data: {
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

      sendComplaintEmails({
        complaintId: complaint.id,
        issueType: issue_type,
        description: description || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        city: city || null,
        state: state || null,
        pinCode: pin_code || null,
      }).catch((err) => {
        console.error("api/complaints email error:", err);
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id });
    }
  } catch (err) {
    console.error("api/complaints POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
