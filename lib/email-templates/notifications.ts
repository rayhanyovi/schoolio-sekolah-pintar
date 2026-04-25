import { NotificationType, Prisma } from "@prisma/client";

type NotificationEmailInput = {
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
};

const TYPE_LABELS: Record<NotificationType, string> = {
  ASSIGNMENT_NEW: "Tugas Baru",
  ASSIGNMENT_DEADLINE: "Pengingat Deadline Tugas",
  GRADE_PUBLISHED: "Nilai Dipublikasikan",
  ATTENDANCE_ALERT: "Peringatan Absensi",
  SYSTEM: "Notifikasi Sistem",
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const buildNotificationEmail = (input: NotificationEmailInput) => {
  const label = TYPE_LABELS[input.type] ?? "Notifikasi";
  const subject = `[Schoolio] ${input.title || label}`;
  const text = `${label}\n\n${input.title}\n${input.message}`;
  const html = [
    `<p><strong>${escapeHtml(label)}</strong></p>`,
    `<h1>${escapeHtml(input.title)}</h1>`,
    `<p>${escapeHtml(input.message)}</p>`,
  ].join("");

  return { subject, text, html };
};
