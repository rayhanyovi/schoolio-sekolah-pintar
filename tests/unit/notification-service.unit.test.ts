import { createInAppNotifications } from "@/lib/notification-service";
import { sendNotificationEmail } from "@/lib/resend";

vi.mock("@/lib/resend", () => ({
  isResendConfigured: vi.fn(() => true),
  sendNotificationEmail: vi.fn(),
}));

describe("notification service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sendNotificationEmail).mockResolvedValue({ ok: true });
  });

  it("membuat in-app notification dan mengirim email sesuai preference", async () => {
    const db = {
      notificationPreference: {
        findMany: vi.fn().mockResolvedValue([
          {
            userId: "user-email-enabled",
            emailNotifications: true,
            assignmentReminders: true,
            attendanceAlerts: true,
            gradePublished: true,
          },
          {
            userId: "user-email-disabled",
            emailNotifications: false,
            assignmentReminders: true,
            attendanceAlerts: true,
            gradePublished: true,
          },
          {
            userId: "user-type-disabled",
            emailNotifications: true,
            assignmentReminders: false,
            attendanceAlerts: true,
            gradePublished: true,
          },
        ]),
        createMany: vi.fn(),
      },
      notification: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            email: "enabled@example.com",
          },
        ]),
      },
    };

    const count = await createInAppNotifications(db as never, {
      recipientIds: [
        "user-email-enabled",
        "user-email-disabled",
        "user-type-disabled",
      ],
      type: "ASSIGNMENT_NEW",
      title: "Tugas Baru",
      message: "Kerjakan sebelum Jumat.",
      triggeredById: "teacher-1",
    });

    expect(count).toBe(2);
    expect(db.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ recipientId: "user-email-enabled" }),
        expect.objectContaining({ recipientId: "user-email-disabled" }),
      ],
    });
    expect(db.user.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["user-email-enabled"] },
        email: { not: null },
      },
      select: { email: true },
    });
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "enabled@example.com",
        subject: "[Schoolio] Tugas Baru",
      })
    );
  });
});
