import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const CHECK_EVERY_MS = 5 * 60 * 1000;
const REMINDER_GAP_MS = 60 * 60 * 1000;

type ReminderGlobal = {
  reminderIntervalStarted?: boolean;
};

const reminderGlobal = globalThis as typeof globalThis & ReminderGlobal;

function createTransport() {
  return nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
}

function isDue(lastSentAt: Date | null, now: Date): boolean {
  if (!lastSentAt) return true;
  return now.getTime() - new Date(lastSentAt).getTime() >= REMINDER_GAP_MS;
}

async function sendReminderEmail(to: string, payload: {
  complaintId: string;
  trackingCode: string;
  issueType: string;
  assignedAt: Date | null;
}) {
  const transporter = createTransport();
  const assignedAtText = payload.assignedAt
    ? payload.assignedAt.toLocaleString("en-IN")
    : "Not available";

  await transporter.sendMail({
    from: "no-reply@connect2one.in",
    to,
    subject: `Reminder: Ticket ${payload.trackingCode} is still in progress`,
    text: [
      "Hi,",
      "",
      "This is an hourly reminder for a ticket currently assigned to you.",
      `Ticket ID: ${payload.complaintId}`,
      `Tracking Code: ${payload.trackingCode}`,
      `Issue Type: ${payload.issueType}`,
      `Assigned At: ${assignedAtText}`,
      "Status: IN_PROGRESS",
      "",
      "Please continue updates until it is resolved.",
      "",
      "Regards,",
      "Connect One Networks",
    ].join("\n"),
  });
}

async function runReminderSweep() {
  const now = new Date();

  const tickets = await prisma.tickets.findMany({
    where: {
      status: "IN_PROGRESS",
      reminder_enabled: true,
      assigned_technician_id: { not: null },
    },
    select: {
      id: true,
      tracking_code: true,
      issue_type: true,
      assigned_at: true,
      last_reminder_sent_at: true,
      assigned_technician: {
        select: {
          email: true,
        },
      },
    },
  });

  for (const ticket of tickets) {
    if (!isDue(ticket.last_reminder_sent_at, now)) {
      continue;
    }

    const technicianEmail = ticket.assigned_technician?.email?.trim();
    if (!technicianEmail) {
      continue;
    }

    try {
      await sendReminderEmail(technicianEmail, {
        complaintId: ticket.id,
        trackingCode: ticket.tracking_code,
        issueType: ticket.issue_type,
        assignedAt: ticket.assigned_at,
      });

      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { last_reminder_sent_at: now },
      });
    } catch (err) {
      console.error("ticket reminder send failed:", err);
    }
  }
}

export function ensureTicketReminderScheduler() {
  if (process.env.NODE_ENV === "test") return;
  if (reminderGlobal.reminderIntervalStarted) return;

  reminderGlobal.reminderIntervalStarted = true;

  setInterval(() => {
    runReminderSweep().catch((err) => {
      console.error("ticket reminder sweep failed:", err);
    });
  }, CHECK_EVERY_MS);
}
