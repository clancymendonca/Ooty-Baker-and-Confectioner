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

  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth`
    : "https://www.ootybakerconfectioner.com/auth";

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Password Reset OTP - Ooty Baker & Confectioner",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #007A4D; margin: 0;">Password Reset Request</h2>
          <p style="color: #555; margin-top: 8px;">You requested to reset your password for the Ooty Baker & Confectioner dashboard.</p>
        </div>
        <div style="background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e0e0e0; text-align: center;">
          <p style="margin: 0 0 16px; color: #333; font-size: 14px;"><strong>Your OTP for password reset is:</strong></p>
          <div style="background: #f0f9f5; border: 1px solid #007A4D; border-radius: 6px; padding: 12px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #007A4D; text-align: center;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 16px;">This OTP will expire in 10 minutes.</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" style="background: #007A4D; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Return to Login
          </a>
        </div>
        <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 24px;">
          If you didn't request this, please ignore this email.
        </p>
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

  // If the user doesn't exist return the same
  // generic message to avoid disclosing account existence.
  if (!user) {
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
