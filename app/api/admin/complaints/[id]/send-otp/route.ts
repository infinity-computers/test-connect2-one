import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth-token";
import { sendEmail } from "../../../../../../lib/email";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getRequestIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        users: {
          select: { email: true, name: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const targetEmail = ticket.users?.email || ticket.reporter_email;
    if (!targetEmail) {
      return NextResponse.json({ error: "No email available for OTP" }, { status: 400 });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otp_challenges.updateMany({
      where: {
        target: targetEmail,
        purpose: "TICKET_RESOLVE",
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      data: { consumed_at: new Date() },
    });

    const challenge = await prisma.otp_challenges.create({
      data: {
        expires_at: otpExpiry,
        otp_hash: hashedOtp,
        user_id: ticket.user_id,
        ticket_id: ticket.id,
        purpose: "TICKET_RESOLVE",
        target_type: "EMAIL",
        target: targetEmail,
        max_attempts: 5,
        request_ip: getRequestIp(req),
        user_agent: req.headers.get("user-agent") || "unknown",
      },
      select: { id: true },
    });

    await Promise.all([
      sendEmail({
        to: targetEmail,
        subject: "Ticket resolution OTP",
        text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      }),
      sendEmail({
        to: targetEmail,
        subject: `Ticket Tracking Code - ${ticket.tracking_code}`,
        text: [
          "Hi,",
          "",
          "Your ticket is being processed.",
          `Tracking Code: ${ticket.tracking_code}`,
          "Use this code to track your ticket.",
          "",
          "Regards,",
          "Connect One Networks",
        ].join("\n"),
      }),
    ]);

    return NextResponse.json({ ok: true, challengeId: challenge.id });
  } catch (err) {
    console.error("admin/tickets/send-otp error:", err);
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}
