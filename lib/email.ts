import nodemailer from "nodemailer";

export function createSendmailTransport() {
  return nodemailer.createTransport({
    sendmail: true,
    newline: "unix",
    path: "/usr/sbin/sendmail",
  });
}

export interface SendEmailOptions {
  to: string | string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const transporter = createSendmailTransport();

  await transporter.sendMail({
    from: options.from || process.env.MAIL_FROM || "no-reply@connect2one.in",
    to: options.to,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
  });
}
