import { NextResponse } from "next/server";
import { logger } from "./logger";

const PRISMA_CONNECTION_CODES = new Set(["P1000", "P1001", "P1002", "P1008", "P1011", "P1017", "P2024", "P5011"]);

interface NormalizedError {
  message?: string;
  code?: string;
  name?: string;
}

function normalize(error: unknown): NormalizedError {
  if (!error) return {};
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      code: (error as { code?: string }).code,
    };
  }
  if (typeof error === "object") {
    const obj = error as NormalizedError;
    return { message: obj.message, name: obj.name, code: obj.code };
  }
  return { message: String(error) };
}

/**
 * Returns true when the error looks like a Prisma / Postgres connection
 * problem (DB unreachable, pool exhausted, timed out). The caller can
 * surface a 503 instead of a generic 500.
 */
export function isDatabaseConnectionError(error: unknown): boolean {
  const { code, name, message } = normalize(error);

  if (code && PRISMA_CONNECTION_CODES.has(code)) return true;
  if (name === "PrismaClientInitializationError") return true;
  if (
    message &&
    (message.includes("Can't reach database") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("MaxClientsInSessionMode") ||
      message.includes("max clients"))
  ) {
    return true;
  }
  return false;
}

/**
 * Build a JSON error response for an exception. If it's a recognized DB
 * connection issue we return 503 with a friendly message, otherwise 500
 * with a generic message (the real error is logged, not exposed to the
 * client).
 */
export function dbErrorResponse(
  error: unknown,
  context: string
): NextResponse {
  logger.error(context, error);

  if (isDatabaseConnectionError(error)) {
    return NextResponse.json(
      { error: "Database connection error. Please try again later." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "An error occurred. Please try again later." },
    { status: 500 }
  );
}
