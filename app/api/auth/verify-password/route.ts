import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { roleToRedirect } from "../../../../lib/auth-token";

export const runtime = "nodejs";

const invalidCredentials = () =>
  NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePhone(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const phone = normalizePhone(body?.phone);

  if (!email || !phone) {
    return NextResponse.json(
      { error: "Email and phone are required" },
      { status: 400 },
    );
  }

  try {
    const userFound = await prisma.users.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!userFound || userFound.role !== "USER") {
      return invalidCredentials();
    }

    if (!userFound.phone || userFound.phone.trim() !== phone) {
      return invalidCredentials();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      {
        userId: userFound.id,
        email: userFound.email,
        role: userFound.role,
        name: userFound.name,
      },
      secret,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json(
      {
        ok: true,
        user: {
          id: userFound.id,
          name: userFound.name,
          email: userFound.email,
          phone: userFound.phone,
          role: userFound.role,
        },
        redirectTo: roleToRedirect(userFound.role),
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
    console.error("auth/verify-password error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
