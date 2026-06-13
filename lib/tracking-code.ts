import { prisma } from "./prisma";

function generateTrackingCode(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TKT-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createUniqueTicketTrackingCode(): Promise<string> {
  while (true) {
    const trackingCode = generateTrackingCode();
    const existing = await prisma.tickets.findUnique({
      where: { tracking_code: trackingCode },
      select: { id: true },
    });
    if (!existing) return trackingCode;
  }
}
