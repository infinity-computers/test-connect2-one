import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth-token";
import { complaints_issue_type } from "../../../generated/prisma/enums";

export const runtime = "nodejs";

type ComplaintBody = {
  issue_type: string;
  description?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const complaints = await prisma.complaints.findMany({
      where: user.role === "ADMIN" || user.role === "TECHNICIAN" 
        ? {} 
        : { user_id: user.userId },
      orderBy: { created_at: "desc" },
      include: {
        users: {
          select: { name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({ complaints });
  } catch (err) {
    console.error("api/complaints GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  let body: ComplaintBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { issue_type, description, name, phone, email, address, city, state, pin_code } = body;

  if (!issue_type) {
    return NextResponse.json({ error: "Issue type is required" }, { status: 400 });
  }

  try {
    if (user) {
      const complaint = await prisma.complaints.create({
        data: {
          user_id: user.userId,
          source: "AUTHENTICATED",
          issue_type: issue_type as complaints_issue_type,
          explicit_description: description || null,
        },
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id });
    } else {
      if (!name || !phone || !email || !address || !city || !state || !pin_code) {
        return NextResponse.json(
          { error: "Name, phone, email, address, city, state, and pin_code are required for guest complaints" },
          { status: 400 }
        );
      }

      const complaint = await prisma.complaints.create({
        data: {
          source: "GUEST",
          reporter_name: name,
          reporter_phone: phone,
          reporter_email: email,
          reporter_address: address,
          issue_type: issue_type as complaints_issue_type,
          explicit_description: description || null,
          city: city || null,
          state: state || null,
          pin_code: pin_code || null,
        },
      });

      return NextResponse.json({ ok: true, complaintId: complaint.id });
    }
  } catch (err) {
    console.error("api/complaints POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
