import { NotificationPreference, NotificationType, Prisma, PrismaClient } from "@prisma/client";
import { buildNotificationEmail } from "@/lib/email-templates/notifications";
import { isResendConfigured, sendNotificationEmail } from "@/lib/resend";

type DbClient = Prisma.TransactionClient | PrismaClient;

type CreateNotificationInput = {
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
  triggeredById?: string | null;
};

const isTypeEnabledByPreference = (
  preference: NotificationPreference | null,
  type: NotificationType
) => {
  if (!preference) return true;
  if (type === "ASSIGNMENT_NEW" || type === "ASSIGNMENT_DEADLINE") {
    return preference.assignmentReminders;
  }
  if (type === "GRADE_PUBLISHED") {
    return preference.gradePublished;
  }
  if (type === "ATTENDANCE_ALERT") {
    return preference.attendanceAlerts;
  }
  return true;
};

const isEmailEnabledByPreference = (
  preference: NotificationPreference | null,
  type: NotificationType
) => {
  if (preference && !preference.emailNotifications) return false;
  return isTypeEnabledByPreference(preference, type);
};

export const ensureNotificationPreference = async (
  db: DbClient,
  userId: string
) =>
  db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

export const createInAppNotifications = async (
  db: DbClient,
  input: CreateNotificationInput
) => {
  const uniqueRecipientIds = Array.from(new Set(input.recipientIds.filter(Boolean)));
  if (!uniqueRecipientIds.length) return 0;

  const preferences = await db.notificationPreference.findMany({
    where: { userId: { in: uniqueRecipientIds } },
  });
  const preferenceMap = new Map(preferences.map((item) => [item.userId, item]));

  const missingPreferenceUserIds = uniqueRecipientIds.filter(
    (userId) => !preferenceMap.has(userId)
  );
  if (missingPreferenceUserIds.length) {
    await db.notificationPreference.createMany({
      data: missingPreferenceUserIds.map((userId) => ({ userId })),
      skipDuplicates: true,
    });
  }

  const enabledRecipientIds = uniqueRecipientIds.filter((recipientId) =>
    isTypeEnabledByPreference(preferenceMap.get(recipientId) ?? null, input.type)
  );
  if (!enabledRecipientIds.length) return 0;

  const result = await db.notification.createMany({
    data: enabledRecipientIds.map((recipientId) => ({
      recipientId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      triggeredById: input.triggeredById ?? null,
    })),
  });

  if (isResendConfigured()) {
    const emailRecipientIds = uniqueRecipientIds.filter((recipientId) =>
      isEmailEnabledByPreference(preferenceMap.get(recipientId) ?? null, input.type)
    );
    if (emailRecipientIds.length) {
      const users = await db.user.findMany({
        where: {
          id: { in: emailRecipientIds },
          email: { not: null },
        },
        select: { email: true },
      });
      const email = buildNotificationEmail({
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data,
      });
      for (const user of users) {
        if (!user.email) continue;
        const delivery = await sendNotificationEmail({
          to: user.email,
          ...email,
        });
        if (!delivery.ok) {
          console.warn(
            `[notification-email] failed to send type=${input.type} to=${user.email} error=${delivery.error}`
          );
        }
      }
    }
  }

  return result.count;
};
