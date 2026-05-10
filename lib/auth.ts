import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const MAX_OTP_ATTEMPTS = 5;
const OTP_BCRYPT_COST = 8;

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

/**
 * Persist a new OTP for the user. The OTP is bcrypt-hashed before storage so a
 * leaked DB row can't be replayed against the verification endpoint, and the
 * attempt counter / used-at marker are reset for a fresh challenge.
 */
export async function updateUserOTP(email: string, otpCode: string, expiry: Date) {
  const otpHash = await bcrypt.hash(otpCode, OTP_BCRYPT_COST);
  return prisma.user.update({
    where: { email },
    data: {
      otpCode: otpHash,
      otpExpiry: expiry,
      otpAttempts: 0,
      otpUsedAt: null,
    },
  });
}

export type OTPVerifyResult =
  | { ok: true }
  | { ok: false; reason: "no-otp" | "expired" | "locked" | "mismatch" };

/**
 * Verify a submitted OTP. On a match the OTP is *not* cleared here so the
 * caller can decide (verify-only step keeps it; reset-password clears it).
 * On a mismatch we increment the attempt counter and clear the OTP after
 * MAX_OTP_ATTEMPTS to defeat brute-force.
 */
export async function verifyOTP(email: string, otp: string): Promise<OTPVerifyResult> {
  const user = await getUserByEmail(email);
  if (!user || !user.otpCode || !user.otpExpiry) {
    return { ok: false, reason: "no-otp" };
  }

  if (user.otpUsedAt) {
    return { ok: false, reason: "no-otp" };
  }

  if (new Date() > user.otpExpiry) {
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiry: null, otpAttempts: 0 },
    });
    return { ok: false, reason: "expired" };
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiry: null },
    });
    return { ok: false, reason: "locked" };
  }

  const matches = await bcrypt.compare(otp, user.otpCode);
  if (!matches) {
    const nextAttempts = user.otpAttempts + 1;
    await prisma.user.update({
      where: { email },
      data: {
        otpAttempts: nextAttempts,
        ...(nextAttempts >= MAX_OTP_ATTEMPTS
          ? { otpCode: null, otpExpiry: null }
          : {}),
      },
    });
    return {
      ok: false,
      reason: nextAttempts >= MAX_OTP_ATTEMPTS ? "locked" : "mismatch",
    };
  }

  return { ok: true };
}

/**
 * Mark the OTP as consumed without changing the password. Use after a successful
 * verify-only step that hands a short-lived token to the client.
 */
export async function consumeOTP(email: string) {
  return prisma.user.update({
    where: { email },
    data: { otpUsedAt: new Date() },
  });
}

export async function updatePassword(email: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  return prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
      otpAttempts: 0,
      otpUsedAt: new Date(),
    },
  });
}
