import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export type AuthRole = "USER" | "ADMIN" | "TECHNICIAN";

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: AuthRole;
  name?: string;
  iat?: number;
  exp?: number;
};

export function getAuthTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("token")?.value ?? null;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthPayloadFromRequest(req: NextRequest): AuthTokenPayload | null {
  const token = getAuthTokenFromRequest(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function getCurrentUser(req: NextRequest): Promise<AuthTokenPayload | null> {
  return getAuthPayloadFromRequest(req);
}

export function roleToRedirect(role: AuthRole): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TECHNICIAN") return "/admin/tickets";
  return "/dashboard";
}
