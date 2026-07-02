import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { sendEmail } from "../../../../lib/email";

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const challengeId =
    typeof body?.challengeId === "string"
      ? body.challengeId
      : typeof body?.id === "string"
        ? body.id
        : "";
  const email = normalizeEmail(body?.email);

  if (!challengeId && !email) {
    return NextResponse.json(
      { error: "challengeId or email is required" },
      { status: 400 },
    );
  }

  try {
    const challenge = challengeId
      ? await prisma.otp_challenges.findUnique({
          where: { id: challengeId },
          include: { users: true },
        })
      : await prisma.otp_challenges.findFirst({
          where: {
            target: email,
            purpose: "ADMIN_LOGIN",
            consumed_at: null,
            expires_at: { gt: new Date() },
          },
          include: { users: true },
          orderBy: { created_at: "desc" },
        });

    if (!challenge || !challenge.users) {
      return invalidCredentials();
    }

    if (challenge.users.auth_type !== "OTP") {
      return invalidCredentials();
    }

    const targetEmail = challenge.target;
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await prisma.otp_challenges.updateMany({
      where: {
        user_id: challenge.users.id,
        purpose: "ADMIN_LOGIN",
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      data: { consumed_at: new Date() },
    });

    const newChallenge = await prisma.otp_challenges.create({
      data: {
        expires_at: otpExpiry,
        otp_hash: hashedOtp,
        user_id: challenge.users.id,
        purpose: "ADMIN_LOGIN",
        target_type: "EMAIL",
        target: targetEmail,
        max_attempts: 5,
        request_ip: getRequestIp(req),
        user_agent: req.headers.get("user-agent") || "unknown",
      },
      select: { id: true },
    });

    await sendEmail({
      to: targetEmail,
      subject: "Your Connect One login OTP",
      text: `Your OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    return NextResponse.json({
      ok: true,
      challengeId: newChallenge.id,
      email: targetEmail,
    });
  } catch (err) {
    console.error("auth/resend-otp error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
