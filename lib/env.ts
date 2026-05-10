import { z } from "zod";

/**
 * Centralized environment variable validation.
 *
 * The schema is a `safeParse` so test runs (which never need SMTP/Sentry
 * configured) and `prisma generate` during the install step (which doesn't
 * need a DB URL) don't crash. Production code paths that require a value
 * use `requireEnv()` to fail loudly if the variable is missing.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid postgres:// URL")
    .optional(),
  AUTH_SESSION_SECRET: z
    .string()
    .min(32, "AUTH_SESSION_SECRET must be at least 32 characters")
    .optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  PRISMA_LOG_QUERIES: z.enum(["0", "1"]).optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // We surface a single warning rather than crashing; the build cannot fail
  // here without breaking `prisma generate` during install.
  const issues = parsed.error.flatten().fieldErrors;
  // eslint-disable-next-line no-console
  console.warn("[env] Invalid environment variables:", issues);
}

export const env: Env = parsed.success ? parsed.data : (process.env as unknown as Env);

/**
 * Use at request time when the value is required. Throws with a descriptive
 * message instead of letting downstream code blow up with cryptic errors.
 */
export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env[key];
  if (value == null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as NonNullable<Env[K]>;
}
