import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getUserByEmail,
  updateUserOTP,
  verifyOTP,
  updatePassword,
} from "@/lib/auth";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import { dbErrorResponse } from "@/lib/api-errors";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email: string, otp: string) {
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_FROM?.trim()) {
    logger.warn("OTP email skipped: SMTP_HOST or SMTP_FROM is not configured");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Password Reset OTP - Ooty Baker",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #40aad1; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function otpFailureMessage(reason: "no-otp" | "expired" | "locked" | "mismatch"): string {
  switch (reason) {
    case "locked":
      return "Too many incorrect attempts. Please request a new OTP.";
    case "expired":
      return "OTP has expired. Please request a new one.";
    default:
      return "Invalid OTP";
  }
}

async function handleSendOtp(email: string, ip: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const limit = await consumeRateLimit(`send-otp:${ip}:${normalizedEmail}`, {
    max: 3,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let user;
  try {
    user = await getUserByEmail(normalizedEmail);
  } catch (error) {
    return dbErrorResponse(error, "Database error fetching user");
  }

  if (!user) {
    // Don't disclose account existence; response is generic and timing is similar.
    return NextResponse.json({
      success: true,
      message: "If the account exists, a reset code has been sent.",
    });
  }

  const otpCode = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await updateUserOTP(normalizedEmail, otpCode, expiry);
  } catch (error) {
    return dbErrorResponse(error, "Database error saving OTP");
  }

  try {
    await sendOTPEmail(normalizedEmail, otpCode);
  } catch (error) {
    // Don't leak SMTP failures back to the client; the OTP is saved and
    // an admin can recover.
    logger.error("Error sending OTP email", error);
  }

  return NextResponse.json({
    success: true,
    message: "If the account exists, a reset code has been sent.",
  });
}

async function handleVerifyOtp(email: string, otp: string, ip: string) {
  if (!otp) {
    return NextResponse.json({ error: "OTP is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const limit = await consumeRateLimit(`verify-otp:${ip}:${normalizedEmail}`, {
    max: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP verification attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let result;
  try {
    result = await verifyOTP(normalizedEmail, otp);
  } catch (error) {
    return dbErrorResponse(error, "Database error verifying OTP");
  }

  if (!result.ok) {
    return NextResponse.json({ error: otpFailureMessage(result.reason) }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "OTP verified" });
}

async function handleResetPassword(
  email: string,
  otp: string,
  password: string,
  ip: string
) {
  if (!otp || !password) {
    return NextResponse.json(
      { error: "Email, OTP and password are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const limit = await consumeRateLimit(`reset-password:${ip}:${normalizedEmail}`, {
    max: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyOTP(normalizedEmail, otp);
    if (!result.ok) {
      return NextResponse.json({ error: otpFailureMessage(result.reason) }, { status: 400 });
    }
    await updatePassword(normalizedEmail, password);
    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    return dbErrorResponse(error, "Database error resetting password");
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { action?: string; email?: string; otp?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { action, email, otp, password } = body;
    const ip = getClientIp(request);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    switch (action) {
      case "send-otp":
        return await handleSendOtp(email, ip);
      case "verify-otp":
        return await handleVerifyOtp(email, otp ?? "", ip);
      case "reset-password":
        return await handleResetPassword(email, otp ?? "", password ?? "", ip);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("OTP route unexpected error", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
