import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";

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

    await createSession(user.id, user.email);
    await clearRateLimit(rateLimitKey);

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    logger.error("Login error", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      );
    }

    const isConnectionError =
      error?.code === "P1001" ||
      error?.code === "P1000" ||
      error?.name === "PrismaClientInitializationError" ||
      error?.message?.includes("Can't reach database");

    return NextResponse.json(
      {
        success: false,
        error: isConnectionError
          ? "Authentication service is temporarily unavailable."
          : "Unable to process login request.",
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
