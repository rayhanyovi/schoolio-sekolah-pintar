type SendPasswordResetEmailPayload = {
  to: string;
  resetUrl: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const getResendConfig = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
};

export const isResendConfigured = () => Boolean(getResendConfig());

export const sendPasswordResetEmail = async ({
  to,
  resetUrl,
}: SendPasswordResetEmailPayload) => {
  const config = getResendConfig();
  if (!config) {
    return { ok: false as const, error: "RESEND_NOT_CONFIGURED" as const };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: "Reset Password Akun Sekolah Pintar",
      text: `Kami menerima permintaan reset password. Buka tautan ini untuk lanjut: ${resetUrl}. Tautan berlaku 30 menit.`,
      html: `<p>Kami menerima permintaan reset password.</p><p><a href="${resetUrl}">Klik di sini untuk reset password</a></p><p>Tautan berlaku 30 menit.</p>`,
    }),
  });

  if (!response.ok) {
    return { ok: false as const, error: "RESEND_REQUEST_FAILED" as const };
  }

  return { ok: true as const };
};
