import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";
import bcrypt from "bcryptjs";
import { ROLE, users_auth_type } from "../../../../generated/prisma/enums";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || (user.role !== "ADMIN" && user.role !== "TECHNICIAN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        auth_type: true,
      },
      orderBy: { email: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("api/admin/users GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type CreateUserBody = {
  name?: string;
  email?: string;
  phone?: string;
  role?: ROLE;
  auth_type?: users_auth_type;
  password?: string;
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateUserBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const role = body.role ?? "USER";
  const authType = body.auth_type ?? "PASSWORD";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !role || !authType) {
    return NextResponse.json({ error: "Name, email, role, and auth_type are required" }, { status: 400 });
  }

  if (authType === "PASSWORD" && !password) {
    return NextResponse.json({ error: "Password is required for PASSWORD auth" }, { status: 400 });
  }

  try {
    const passwordHash = authType === "PASSWORD" ? await bcrypt.hash(password, 10) : null;

    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        auth_type: authType,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        auth_type: true,
      },
    });

    return NextResponse.json({ ok: true, user: newUser }, { status: 201 });
  } catch (err) {
    console.error("api/admin/users POST error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
