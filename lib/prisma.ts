import { PrismaClient } from "@prisma/client";

import "./env"; // Validate environment at boot.
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase: serverless deployments must use the Transaction pooler (port
 * 6543) with `pgbouncer=true`. The Session pooler (5432) hits client limits
 * quickly under load. We auto-correct mistakes here as a defensive net.
 */
function getNormalizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const parsed = new URL(rawUrl);
    const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");

    if (isSupabasePooler && parsed.port === "5432") {
      parsed.port = "6543";
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      logger.warn(
        "DATABASE_URL used Supabase session pooler (5432). Auto-switched to transaction pooler (6543) with pgbouncer=true."
      );
      return parsed.toString();
    }

    if (
      isSupabasePooler &&
      parsed.port === "6543" &&
      !parsed.searchParams.has("pgbouncer")
    ) {
      parsed.searchParams.set("pgbouncer", "true");
      logger.warn("Added missing pgbouncer=true to Supabase transaction pooler URL.");
      return parsed.toString();
    }
  } catch {
    // Keep raw URL if parsing fails; Prisma will report a usable error.
  }

  return rawUrl;
}

const normalizedDatabaseUrl = getNormalizedDatabaseUrl();

if (!globalForPrisma.prisma) {
  if (normalizedDatabaseUrl) {
    const portMatch = normalizedDatabaseUrl.match(/:(\d+)\//);
    const port = portMatch ? portMatch[1] : "unknown";
    logger.info("Prisma client init", {
      port,
      mode: port === "6543" ? "transaction" : port === "5432" ? "session" : "unknown",
      pgbouncer: normalizedDatabaseUrl.includes("pgbouncer=true"),
    });
  } else {
    logger.warn("Prisma client init without DATABASE_URL");
  }
}

const shouldLogQueries = process.env.PRISMA_LOG_QUERIES === "1";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: shouldLogQueries
      ? ["query", "error", "warn"]
      : process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: normalizedDatabaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
