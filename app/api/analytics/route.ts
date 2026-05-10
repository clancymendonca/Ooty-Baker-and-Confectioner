import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Middleware enforces auth for /api/analytics.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all inquiries in the period
    const inquiries = await prisma.businessInquiry.findMany({
      where: {
        createdAt: { gte: startDate },
        isDeleted: false,
      },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Daily inquiry counts
    const dailyInquiries: Record<string, number> = {};
    inquiries.forEach((inquiry) => {
      const date = inquiry.createdAt.toISOString().split("T")[0];
      dailyInquiries[date] = (dailyInquiries[date] || 0) + 1;
    });

    // Status distribution
    const statusDistribution = {
      new: inquiries.filter((i) => i.status === "new").length,
      inProgress: inquiries.filter((i) => i.status === "inProgress").length,
      completed: inquiries.filter((i) => i.status === "completed").length,
      cancelled: inquiries.filter((i) => i.status === "cancelled").length,
    };

    // Product popularity
    const productCounts: Record<number, { name: string; count: number; revenue: number }> = {};
    inquiries.forEach((inquiry) => {
      inquiry.inquiryProducts.forEach((ip) => {
        if (!productCounts[ip.productId]) {
          productCounts[ip.productId] = {
            name: ip.product.name,
            count: 0,
            revenue: 0,
          };
        }
        productCounts[ip.productId].count += 1;
        productCounts[ip.productId].revenue += Number(ip.product.price);
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Revenue by day
    const dailyRevenue: Record<string, number> = {};
    inquiries.forEach((inquiry) => {
      const date = inquiry.createdAt.toISOString().split("T")[0];
      const revenue = inquiry.inquiryProducts.reduce(
        (sum, ip) => sum + Number(ip.product.price),
        0
      );
      dailyRevenue[date] = (dailyRevenue[date] || 0) + revenue;
    });

    // Response time by day
    const dailyResponseTime: Record<string, number[]> = {};
    inquiries
      .filter((i) => i.status !== "new")
      .forEach((inquiry) => {
        const date = inquiry.updatedAt.toISOString().split("T")[0];
        const responseTime =
          (inquiry.updatedAt.getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60); // hours
        if (!dailyResponseTime[date]) {
          dailyResponseTime[date] = [];
        }
        dailyResponseTime[date].push(responseTime);
      });

    const avgDailyResponseTime: Record<string, number> = {};
    Object.keys(dailyResponseTime).forEach((date) => {
      const times = dailyResponseTime[date];
      avgDailyResponseTime[date] =
        times.reduce((sum, time) => sum + time, 0) / times.length;
    });

    // Conversion funnel
    const conversionFunnel = {
      total: inquiries.length,
      new: statusDistribution.new,
      inProgress: statusDistribution.inProgress,
      completed: statusDistribution.completed,
      cancelled: statusDistribution.cancelled,
    };

    // Business nature distribution
    const businessNatureCounts: Record<string, number> = {};
    inquiries.forEach((inquiry) => {
      const nature = inquiry.businessNature || "Unknown";
      businessNatureCounts[nature] = (businessNatureCounts[nature] || 0) + 1;
    });

    // Delivery frequency distribution
    const frequencyCounts: Record<string, number> = {};
    inquiries.forEach((inquiry) => {
      const freq = inquiry.deliveryFrequency || "Unknown";
      frequencyCounts[freq] = (frequencyCounts[freq] || 0) + 1;
    });

    return NextResponse.json({
      period: days,
      dailyInquiries,
      statusDistribution,
      topProducts,
      dailyRevenue,
      avgDailyResponseTime,
      conversionFunnel,
      businessNatureCounts,
      frequencyCounts,
      totalRevenue: inquiries.reduce(
        (sum, inquiry) =>
          sum +
          inquiry.inquiryProducts.reduce(
            (s, ip) => s + Number(ip.product.price),
            0
          ),
        0
      ),
      totalInquiries: inquiries.length,
    });
  } catch (error) {
    logger.error("Error fetching analytics", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
