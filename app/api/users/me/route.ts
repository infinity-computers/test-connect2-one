import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAuthPayloadFromRequest } from "../../../../lib/auth-token";

export const runtime = "nodejs";

type UpdateProfileBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanEmail(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function PATCH(req: NextRequest) {
  const payload = getAuthPayloadFromRequest(req);

  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: UpdateProfileBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = cleanString(body.name);
  const email = cleanEmail(body.email);
  const phone = cleanString(body.phone);

  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "Name, email, and phone are required" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  try {
    const existingEmailUser = await prisma.users.findFirst({
      where: {
        email,
        id: { not: payload.userId },
      },
      select: { id: true },
    });

    if (existingEmailUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }

    const existingPhoneUser = await prisma.users.findFirst({
      where: {
        phone,
        id: { not: payload.userId },
      },
      select: { id: true },
    });

    if (existingPhoneUser) {
      return NextResponse.json({ error: "Phone number is already in use" }, { status: 409 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: payload.userId },
      data: { name, email, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing");
    }

    const token = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
      },
      secret,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json({ ok: true, user: updatedUser }, { status: 200 });
    res.cookies.set("token", token, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("api/users/me PATCH error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
