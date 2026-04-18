import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";
import { roleToRedirect } from "../../../../lib/auth-token";

export const runtime = "nodejs";

const invalidCredentials = () =>
  NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const challengeId =
    typeof body?.challengeId === "string"
      ? body.challengeId
      : typeof body?.id === "string"
        ? body.id
        : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!challengeId || !otp) {
    return NextResponse.json(
      { error: "challengeId and otp are required" },
      { status: 400 },
    );
  }

  try {
    const challenge = await prisma.otp_challenges.findUnique({
      where: { id: challengeId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            auth_type: true,
          },
        },
      },
    });

    if (!challenge || !challenge.users) {
      return invalidCredentials();
    }

    if (challenge.users.auth_type !== "OTP" || challenge.purpose !== "ADMIN_LOGIN") {
      return invalidCredentials();
    }

    if (challenge.consumed_at || challenge.expires_at <= new Date()) {
      return invalidCredentials();
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return invalidCredentials();
    }

    const isOtpValid = await bcrypt.compare(otp, challenge.otp_hash);

    if (!isOtpValid) {
      await prisma.otp_challenges.update({
        where: { id: challenge.id },
        data: { attempts: challenge.attempts + 1 },
      });
      return invalidCredentials();
    }

    await prisma.otp_challenges.update({
      where: { id: challenge.id },
      data: { consumed_at: new Date() },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      {
        userId: challenge.users.id,
        email: challenge.users.email,
        role: challenge.users.role,
        name: challenge.users.name,
      },
      secret,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json(
      {
        ok: true,
        user: {
          id: challenge.users.id,
          name: challenge.users.name,
          email: challenge.users.email,
          phone: challenge.users.phone,
          role: challenge.users.role,
        },
        redirectTo: roleToRedirect(challenge.users.role),
      },
      { status: 200 },
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("auth/verify-otp error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
