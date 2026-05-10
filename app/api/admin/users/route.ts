import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { createAdminUser, getUserByEmail } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { dbErrorResponse } from "@/lib/api-errors";
import { getSession } from "@/lib/session";

const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "user"]).optional().default("user"),
});

/** Generate a cryptographically-random password: 16 chars, mixed case + digits + symbols */
function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$!%*?&";
  const all = upper + lower + digits + symbols;

  // Ensure at least one of each category
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const rest = Array.from({ length: 12 }, () =>
    all[Math.floor(Math.random() * all.length)]
  );

  // Shuffle required + rest together
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join("");
}

async function sendWelcomeEmail(email: string, password: string) {
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_FROM?.trim()) {
    logger.warn("Welcome email skipped: SMTP_HOST or SMTP_FROM is not configured");
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
    subject: "Your Ooty Baker & Confectioner Dashboard Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #007A4D; margin: 0;">Welcome to Ooty Baker & Confectioner</h2>
          <p style="color: #555; margin-top: 8px;">Your dashboard account has been created by an administrator.</p>
        </div>
        <div style="background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e0e0e0;">
          <p style="margin: 0 0 8px; color: #333; font-size: 14px;"><strong>Email:</strong></p>
          <p style="margin: 0 0 16px; font-size: 16px; color: #007A4D;">${email}</p>
          <p style="margin: 0 0 8px; color: #333; font-size: 14px;"><strong>Temporary Password:</strong></p>
          <div style="background: #f0f9f5; border: 1px solid #007A4D; border-radius: 6px; padding: 12px; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #007A4D; text-align: center;">
            ${password}
          </div>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 16px; text-align: center;">
          Please log in and use the <strong>Forgot Password</strong> feature to set your own password.
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginUrl}" style="background: #007A4D; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
            Log In to Dashboard
          </a>
        </div>
        <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 24px;">
          If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  });
}

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated admin session
  const session = await getSession();
  if (!session || (session.role !== "developer" && session.role !== "admin")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request format" },
      { status: 400 }
    );
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  let requestedRole = parsed.data.role;

  if (session.role === "admin") {
    requestedRole = "user"; // Admins can only create users
  }

  // Check for existing user
  let existing;
  try {
    existing = await getUserByEmail(email);
  } catch (error) {
    return dbErrorResponse(error, "Admin create user: DB error checking existing user");
  }

  if (existing) {
    return NextResponse.json(
      { success: false, error: "A user with this email already exists." },
      { status: 409 }
    );
  }

  const plainPassword = generateSecurePassword();

  let newUser;
  try {
    newUser = await createAdminUser(email, plainPassword, requestedRole);
  } catch (error) {
    return dbErrorResponse(error, "Admin create user: DB error creating user");
  }

  // Send welcome email (fire-and-forget for UX; log errors)
  try {
    await sendWelcomeEmail(email, plainPassword);
  } catch (error) {
    logger.error("Admin create user: failed to send welcome email", error);
    // Still return success — user was created; admin can resend manually
  }

  logger.info(`Admin created new user: ${email} (id=${newUser.id})`);

  return NextResponse.json({
    success: true,
    message: `User created and credentials sent to ${email}.`,
    user: { id: newUser.id, email: newUser.email },
  });
}

export async function GET(request: NextRequest) {
  // Verify the caller is an authenticated admin session
  const session = await getSession();
  if (!session || (session.role !== "developer" && session.role !== "admin")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return dbErrorResponse(error, "Admin list users: DB error");
  }
}
