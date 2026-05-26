import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 10;

const invalidCredentials = () =>
  NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

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
    subject: "Your Connect One login OTP",
    text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const userFound = await prisma.users.findFirst({ where: { email } });

    if (!userFound) {
      return invalidCredentials();
    }

    // USER logins are now phone-match based.
    if (userFound.role === "USER") {
      return NextResponse.json({
        ok: true,
        nextStep: "phone",
        email,
      });
    }

    // Staff login remains OTP based.
    if (userFound.auth_type !== "OTP") {
      return invalidCredentials();
    }

    if (userFound.role !== "ADMIN" && userFound.role !== "TECHNICIAN") {
      return invalidCredentials();
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otp_challenges.updateMany({
      where: {
        target: email,
        purpose: "ADMIN_LOGIN",
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      data: { consumed_at: new Date() },
    });

    const challenge = await prisma.otp_challenges.create({
      data: {
        expires_at: otpExpiry,
        otp_hash: hashedOtp,
        user_id: userFound.id,
        purpose: "ADMIN_LOGIN",
        target_type: "EMAIL",
        target: email,
        max_attempts: 5,
        request_ip: getRequestIp(req),
        user_agent: req.headers.get("user-agent") || "unknown",
      },
      select: { id: true },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({
      ok: true,
      nextStep: "otp",
      email,
      challengeId: challenge.id,
    });
  } catch (err) {
    console.error("auth/start error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
