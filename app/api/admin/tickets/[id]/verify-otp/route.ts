import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../../lib/auth-token";

export const runtime = "nodejs";

const invalidOtp = () =>
  NextResponse.json({ error: "Invalid OTP" }, { status: 401 });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(req);
  const { id } = await params;

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : "";
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
    });

    if (!challenge) {
      return invalidOtp();
    }

    if (challenge.purpose !== "TICKET_RESOLVE" || challenge.ticket_id !== id) {
      return invalidOtp();
    }

    if (challenge.consumed_at || challenge.expires_at <= new Date()) {
      return invalidOtp();
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return invalidOtp();
    }

    const isOtpValid = await bcrypt.compare(otp, challenge.otp_hash);

    if (!isOtpValid) {
      await prisma.otp_challenges.update({
        where: { id: challenge.id },
        data: { attempts: challenge.attempts + 1 },
      });
      return invalidOtp();
    }

    await prisma.otp_challenges.update({
      where: { id: challenge.id },
      data: { consumed_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/tickets/verify-otp error:", err);
    return NextResponse.json({ error: "INTERNAL SERVER ERROR" }, { status: 500 });
  }
}
