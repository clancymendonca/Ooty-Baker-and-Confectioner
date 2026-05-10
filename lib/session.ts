import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { createSessionToken, verifySessionToken } from "./session-token";

export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/**
 * Build a signed session token. Route handlers must attach it with
 * {@link attachAuthSessionCookie} on the same {@link NextResponse} they return,
 * so Set-Cookie is applied (Next.js 15 does not reliably merge cookie mutations
 * from `cookies().set()` with a separately created JSON response).
 */
export async function signAuthSessionToken(userId: number, email: string): Promise<string> {
  const sessionData = {
    userId,
    email,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  };
  return createSessionToken(sessionData);
}

export function attachAuthSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
}

export function clearAuthSessionCookie(response: NextResponse): void {
  response.cookies.delete({ name: SESSION_COOKIE_NAME, path: "/" });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionData = await verifySessionToken(sessionCookie.value);
    if (!sessionData) {
      await destroySession();
      return null;
    }

    // Check if session is expired
    const expiresAt = new Date(sessionData.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      await destroySession();
      return null;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      await destroySession();
      return null;
    }

    return { id: user.id, email: user.email, role: user.role };
  } catch (error: any) {
    logger.error("Session error", error);
    return null;
  }
}

/** Clears the session cookie when you do not control the outgoing `NextResponse` (e.g. Server Components). */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
