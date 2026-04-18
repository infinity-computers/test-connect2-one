import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAuthPayloadFromRequest } from "../../../../lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayloadFromRequest(req);

    if (!payload?.userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        auth_type: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("auth/me error:", err);
    return NextResponse.json(
      { error: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
