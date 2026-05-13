import { Prisma } from "@prisma/client";
import { jsonError } from "@/lib/api";

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);

export type AuthOperation =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "change-password"
  | "onboarding"
  | "onboarding-select-role"
  | "onboarding-complete"
  | "onboarding-link-child"
  | "session"
  | "logout";

type AuthErrorDetailValue =
  | string
  | number
  | boolean
  | null
  | string[];

type AuthErrorDetails = Record<string, AuthErrorDetailValue>;

type AuthErrorResponseOptions = {
  uniqueConflictMessage?: string;
};

const OPERATION_LABELS: Record<AuthOperation, string> = {
  login: "login",
  register: "registrasi",
  "forgot-password": "lupa password",
  "reset-password": "reset password",
  "change-password": "ganti password",
  onboarding: "onboarding",
  "onboarding-select-role": "pemilihan role onboarding",
  "onboarding-complete": "penyelesaian onboarding",
  "onboarding-link-child": "hubungkan anak",
  session: "session auth",
  logout: "logout",
};

const isAuthErrorDebugEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  TRUE_VALUES.has((process.env.AUTH_ERROR_DEBUG ?? "").trim().toLowerCase());

const getCorrelationId = (request: Request) =>
  request.headers.get("x-correlation-id") ?? null;

const buildDetails = (
  request: Request,
  operation: AuthOperation,
  reason: string,
  details: AuthErrorDetails = {},
  error?: unknown,
) => {
  const correlationId = getCorrelationId(request);
  const debugMessage =
    isAuthErrorDebugEnabled() && error instanceof Error
      ? error.message
      : undefined;

  return {
    operation,
    reason,
    ...(correlationId ? { correlationId } : {}),
    ...details,
    ...(debugMessage ? { debugMessage } : {}),
  };
};

const logAuthError = (
  request: Request,
  operation: AuthOperation,
  reason: string,
  error: unknown,
) => {
  const correlationId = getCorrelationId(request) ?? "-";
  console.error(
    `[auth-error] operation=${operation} correlationId=${correlationId} reason=${reason}`,
    error,
  );
};

export const jsonAuthError = (
  request: Request,
  operation: AuthOperation,
  code: string,
  message: string,
  status: number,
  reason: string,
  details: AuthErrorDetails = {},
) =>
  jsonError(code, message, status, {
    details: buildDetails(request, operation, reason, details),
  });

export const jsonUnexpectedAuthError = (
  request: Request,
  operation: AuthOperation,
  error: unknown,
  options: AuthErrorResponseOptions = {},
) => {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logAuthError(request, operation, "database_unavailable", error);
    return jsonError(
      "CONFLICT",
      "Layanan database belum tersedia",
      503,
      {
        details: buildDetails(
          request,
          operation,
          "database_unavailable",
          { source: "prisma" },
          error,
        ),
      },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      logAuthError(request, operation, "database_table_missing", error);
      return jsonError(
        "CONFLICT",
        "Tabel database auth belum tersedia. Jalankan migrasi database terlebih dahulu.",
        503,
        {
          details: buildDetails(
            request,
            operation,
            "database_table_missing",
            { prismaCode: error.code },
            error,
          ),
        },
      );
    }

    if (error.code === "P2022") {
      logAuthError(request, operation, "database_column_missing", error);
      return jsonError(
        "CONFLICT",
        "Kolom database auth belum sesuai schema. Jalankan migrasi database terlebih dahulu.",
        503,
        {
          details: buildDetails(
            request,
            operation,
            "database_column_missing",
            { prismaCode: error.code },
            error,
          ),
        },
      );
    }

    if (error.code === "P2002") {
      logAuthError(request, operation, "unique_constraint_failed", error);
      return jsonError(
        "CONFLICT",
        options.uniqueConflictMessage ?? "Data sudah terdaftar",
        409,
        {
          details: buildDetails(
            request,
            operation,
            "unique_constraint_failed",
            { prismaCode: error.code },
            error,
          ),
        },
      );
    }

    if (error.code === "P2025") {
      logAuthError(request, operation, "record_not_found", error);
      return jsonError("NOT_FOUND", "Data auth tidak ditemukan", 404, {
        details: buildDetails(
          request,
          operation,
          "record_not_found",
          { prismaCode: error.code },
          error,
        ),
      });
    }

    logAuthError(request, operation, "database_known_request_error", error);
    return jsonError("CONFLICT", "Gagal mengakses database", 500, {
      details: buildDetails(
        request,
        operation,
        "database_known_request_error",
        { prismaCode: error.code },
        error,
      ),
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    logAuthError(request, operation, "database_query_validation_failed", error);
    return jsonError("CONFLICT", "Query database auth tidak valid", 500, {
      details: buildDetails(
        request,
        operation,
        "database_query_validation_failed",
        { source: "prisma" },
        error,
      ),
    });
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logAuthError(request, operation, "database_unknown_request_error", error);
    return jsonError("CONFLICT", "Gagal mengakses database", 500, {
      details: buildDetails(
        request,
        operation,
        "database_unknown_request_error",
        { source: "prisma" },
        error,
      ),
    });
  }

  if (error instanceof Error && error.message === "FAILED_TO_GENERATE_SCHOOL_CODE") {
    logAuthError(request, operation, "failed_to_generate_school_code", error);
    return jsonError("CONFLICT", "Gagal membuat kode sekolah unik", 409, {
      details: buildDetails(
        request,
        operation,
        "failed_to_generate_school_code",
        {},
        error,
      ),
    });
  }

  logAuthError(request, operation, "unexpected_error", error);
  return jsonError(
    "CONFLICT",
    `Gagal memproses ${OPERATION_LABELS[operation]}`,
    500,
    {
      details: buildDetails(
        request,
        operation,
        "unexpected_error",
        {},
        error,
      ),
    },
  );
};
