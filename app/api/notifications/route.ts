import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await prisma.site_notifications.findMany({
      where: {
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: [{ expires_at: "asc" }, { created_at: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        expires_at: true,
        created_at: true,
      },
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("api/notifications GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
