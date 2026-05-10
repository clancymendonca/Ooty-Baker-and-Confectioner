import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { logger } from "./logger";
import { createSessionToken, verifySessionToken } from "./session-token";

export interface SessionUser {
  id: number;
  email: string;
}

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: number, email: string) {
  try {
    const cookieStore = await cookies();
    const sessionData = {
      userId,
      email,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
    };
    const token = await createSessionToken(sessionData);
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return sessionData;
  } catch (error: any) {
    logger.error("Error creating session cookie", error);
    throw new Error(`Failed to set session cookie: ${error?.message || "Unknown error"}`);
  }
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
      select: { id: true, email: true },
    });

    if (!user) {
      await destroySession();
      return null;
    }

    return { id: user.id, email: user.email };
  } catch (error: any) {
    logger.error("Session error", error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
