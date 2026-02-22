type AssignmentLatePolicy = {
  dueDate: Date;
  allowLateSubmission: boolean;
  lateUntil: Date | null;
};

type SubmissionWindowResult = {
  allowed: boolean;
  reason?: string;
};

export const canSubmitAssignmentAt = (
  policy: AssignmentLatePolicy,
  now = new Date()
): SubmissionWindowResult => {
  if (now.getTime() <= policy.dueDate.getTime()) {
    return { allowed: true };
  }

  if (!policy.allowLateSubmission) {
    return {
      allowed: false,
      reason: "Deadline tugas telah lewat dan late submission tidak diizinkan",
    };
  }

  if (!policy.lateUntil) {
    return {
      allowed: false,
      reason: "Konfigurasi late submission belum lengkap",
    };
  }

  if (now.getTime() > policy.lateUntil.getTime()) {
    return {
      allowed: false,
      reason: "Periode late submission telah berakhir",
    };
  }

  return { allowed: true };
};
