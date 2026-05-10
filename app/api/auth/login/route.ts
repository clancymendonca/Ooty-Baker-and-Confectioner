import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/auth";
import { attachAuthSessionCookie, signAuthSessionToken } from "@/lib/session";
import { logger } from "@/lib/logger";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { isDatabaseConnectionError } from "@/lib/api-errors";
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please fill in all fields" },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;

    const ip = getClientIp(request);
    const normalizedUsername = username.trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${normalizedUsername}`;
    const rateLimitResult = await consumeRateLimit(rateLimitKey, {
      max: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfterSeconds),
          },
        }
      );
    }

    const user = await getUserByEmail(normalizedUsername);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signAuthSessionToken(user.id, user.email);
    await clearRateLimit(rateLimitKey);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
    attachAuthSessionCookie(response, token);
    return response;
  } catch (error: any) {
    logger.error("Login error", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }

    const isConnectionError = isDatabaseConnectionError(error);

    const isSessionSecretMissing =
      typeof error?.message === "string" &&
      error.message.includes("Missing AUTH_SESSION_SECRET");

    const useUnavailable =
      isConnectionError || isSessionSecretMissing;

    return NextResponse.json(
      {
        success: false,
        error: useUnavailable
          ? "Authentication service is temporarily unavailable."
          : "Unable to process login request.",
      },
      { status: useUnavailable ? 503 : 500 }
    );
  }
}
