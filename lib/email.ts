import nodemailer from "nodemailer";

export function createSendmailTransport() {
  return nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
}

export async function sendPlainEmail(options: {
  to: string | string[];
  bcc?: string[];
  subject: string;
  text: string;
}) {
  const transporter = createSendmailTransport();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "no-reply@connect2one.in",
    to: options.to,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
  });
}
