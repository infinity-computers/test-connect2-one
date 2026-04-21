import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth-token";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

async function sendOtpEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });

  await transporter.sendMail({
    from: "no-reply@connect2one.in",
    to: email,
    subject: "Complaint resolution OTP",
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  });

  // Previous SMTP-based sender kept for reference.
  // const host = process.env.SMTP_HOST;
  // const port = Number(process.env.SMTP_PORT || "587");
  // const user = process.env.SMTP_USER;
  // const pass = process.env.SMTP_PASS;
  // const from = process.env.SMTP_FROM || user;
  // if (!host || !user || !pass || !from) {
  //   throw new Error("SMTP configuration is missing");
  // }
  // const smtpTransporter = nodemailer.createTransport({
  //   host,
  //   port,
  //   secure: port === 465,
  //   auth: { user, pass },
  // });
  // await smtpTransporter.sendMail({
  //   from,
  //   to: email,
  //   subject: "Complaint resolution OTP",
  //   text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  // });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
          select: { email: true, name: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const targetEmail = complaint.users?.email || complaint.reporter_email;
    if (!targetEmail) {
      return NextResponse.json({ error: "No email available for OTP" }, { status: 400 });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otp_challenges.updateMany({
      where: {
        target: targetEmail,
        purpose: "COMPLAINT_RESOLVE",
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      data: { consumed_at: new Date() },
    });

    const challenge = await prisma.otp_challenges.create({
      data: {
        expires_at: otpExpiry,
        otp_hash: hashedOtp,
        user_id: complaint.user_id,
        complaint_id: complaint.id,
        purpose: "COMPLAINT_RESOLVE",
        target_type: "EMAIL",
        target: targetEmail,
        max_attempts: 5,
        request_ip: getRequestIp(req),
        user_agent: req.headers.get("user-agent") || "unknown",
      },
      select: { id: true },
    });

    await sendOtpEmail(targetEmail, otp);

    return NextResponse.json({ ok: true, challengeId: challenge.id });
  } catch (err) {
    console.error("admin/complaints/send-otp error:", err);
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}
