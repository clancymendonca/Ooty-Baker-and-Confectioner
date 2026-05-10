import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Never participate in static generation: this handler is a long-lived SSE stream.
export const dynamic = "force-dynamic";

// Middleware enforces auth for /api/dashboard/*.

const SSE_INTERVAL_MS = 30_000;

interface DashboardCounts {
  totalInquiries: number;
  newInquiries: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  productCount: number;
}

/**
 * Single round-trip aggregation. Postgres' COUNT(*) FILTER (WHERE ...) lets
 * us collapse the previous 7 separate queries into one.
 */
async function getDashboardCounts(): Promise<DashboardCounts> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<Array<{
    total_inquiries: bigint;
    new_inquiries: bigint;
    in_progress: bigint;
    completed: bigint;
    cancelled: bigint;
    product_count: bigint;
  }>>`
    SELECT
      (SELECT COUNT(*) FROM business_inquiries WHERE is_deleted = false) AS total_inquiries,
      (SELECT COUNT(*) FROM business_inquiries
        WHERE is_deleted = false AND status = 'new' AND created_at >= ${startOfWeek}) AS new_inquiries,
      (SELECT COUNT(*) FROM business_inquiries
        WHERE is_deleted = false AND status = 'inProgress') AS in_progress,
      (SELECT COUNT(*) FROM business_inquiries
        WHERE is_deleted = false AND status = 'completed' AND updated_at >= ${startOfWeek}) AS completed,
      (SELECT COUNT(*) FROM business_inquiries
        WHERE is_deleted = false AND status = 'cancelled' AND updated_at >= ${startOfWeek}) AS cancelled,
      (SELECT COUNT(*) FROM products) AS product_count
  `;

  const row = rows[0];
  return {
    totalInquiries: Number(row.total_inquiries),
    newInquiries: Number(row.new_inquiries),
    inProgress: Number(row.in_progress),
    completed: Number(row.completed),
    cancelled: Number(row.cancelled),
    productCount: Number(row.product_count),
  };
}

export async function GET(request: NextRequest) {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      sendEvent({ type: "connected", timestamp: new Date().toISOString() });

      const tick = async () => {
        try {
          const counts = await getDashboardCounts();
          sendEvent({
            type: "stats",
            data: {
              totalInquiries: counts.totalInquiries,
              newInquiries: counts.newInquiries,
              inProgress: counts.inProgress,
              completed: counts.completed,
              cancelled: counts.cancelled,
              productCount: counts.productCount,
            },
          });
          sendEvent({ type: "inquiry_count", data: { count: counts.totalInquiries } });
          sendEvent({ type: "product_count", data: { count: counts.productCount } });
        } catch (error) {
          logger.error("Error in SSE stream", error);
          sendEvent({ type: "error", message: "Failed to fetch updates" });
        }
      };

      // Push once immediately so the dashboard isn't blank for 30s.
      tick();
      const interval = setInterval(tick, SSE_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}
