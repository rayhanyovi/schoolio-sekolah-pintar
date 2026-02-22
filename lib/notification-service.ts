import { NotificationPreference, NotificationType, Prisma, PrismaClient } from "@prisma/client";

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

  return result.count;
};
