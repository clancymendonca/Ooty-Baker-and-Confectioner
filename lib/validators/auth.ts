import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(200),
  password: z.string().min(1, "Password is required").max(200),
});

export const sendOtpSchema = z.object({
  action: z.literal("send-otp"),
  email: z.string().trim().email().max(200),
});

export const verifyOtpSchema = z.object({
  action: z.literal("verify-otp"),
  email: z.string().trim().email().max(200),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const resetPasswordSchema = z.object({
  action: z.literal("reset-password"),
  email: z.string().trim().email().max(200),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export const otpActionSchema = z.discriminatedUnion("action", [
  sendOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type OtpAction = z.infer<typeof otpActionSchema>;
