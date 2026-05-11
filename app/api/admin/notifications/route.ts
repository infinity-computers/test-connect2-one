import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotificationBody = {
  title?: string;
  description?: string;
  expiresAt?: string;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.site_notifications.findMany({
      orderBy: [{ expires_at: "desc" }, { created_at: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("api/admin/notifications GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: NotificationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const expiresAtRaw = typeof body.expiresAt === "string" ? body.expiresAt.trim() : "";

  if (!title || !description || !expiresAtRaw) {
    return NextResponse.json({ error: "Title, description, and expiresAt are required" }, { status: 400 });
  }

  const expiresAt = new Date(expiresAtRaw);
  if (Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Invalid expiresAt value" }, { status: 400 });
  }

  if (expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Expiry must be in the future" }, { status: 400 });
  }

  try {
    const notification = await prisma.site_notifications.create({
      data: {
        title,
        description,
        expires_at: expiresAt,
      },
      select: {
        id: true,
        title: true,
        description: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ ok: true, notification }, { status: 201 });
  } catch (err) {
    console.error("api/admin/notifications POST error:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
