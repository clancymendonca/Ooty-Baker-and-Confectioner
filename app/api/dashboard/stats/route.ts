import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Middleware enforces auth for /api/dashboard/*.

export async function GET() {
  try {
    // Total inquiries
    const totalInquiries = await prisma.businessInquiry.count({
      where: { isDeleted: false },
    });

    // New inquiries this week
    const newInquiries = await prisma.businessInquiry.count({
      where: {
        status: "new",
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // In progress inquiries
    const inProgressInquiries = await prisma.businessInquiry.count({
      where: { status: "inProgress" },
    });

    // Completed this week
    const completedInquiries = await prisma.businessInquiry.count({
      where: {
        status: "completed",
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Cancelled this week
    const cancelledInquiries = await prisma.businessInquiry.count({
      where: {
        status: "cancelled",
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Average response time
    const inquiriesWithResponse = await prisma.businessInquiry.findMany({
      where: {
        status: { not: "new" },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const avgResponseTime =
      inquiriesWithResponse.length > 0
        ? inquiriesWithResponse.reduce((acc, inquiry) => {
            const diff = inquiry.updatedAt.getTime() - inquiry.createdAt.getTime();
            return acc + diff / (1000 * 60 * 60); // Convert to hours
          }, 0) / inquiriesWithResponse.length
        : 0;

    // Conversion rate (last 30 days)
    const last30Days = await prisma.businessInquiry.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        status: true,
      },
    });

    const conversionRate =
      last30Days.length > 0
        ? (last30Days.filter((i) => i.status === "completed").length /
            last30Days.length) *
          100
        : 0;

    // Estimated value (this week)
    const thisWeekInquiries = await prisma.businessInquiry.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    const estimatedValue = thisWeekInquiries.reduce((acc, inquiry) => {
      const inquiryValue = inquiry.inquiryProducts.reduce(
        (sum, ip) => sum + Number(ip.product.price),
        0
      );
      return acc + inquiryValue;
    }, 0);

    // Trends
    const lastMonthInquiries = await prisma.businessInquiry.count({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const lastWeekNewInquiries = await prisma.businessInquiry.count({
      where: {
        status: "new",
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const lastWeekCompleted = await prisma.businessInquiry.count({
      where: {
        status: "completed",
        updatedAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const lastWeekCancelled = await prisma.businessInquiry.count({
      where: {
        status: "cancelled",
        updatedAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const lastWeekInquiries = await prisma.businessInquiry.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    const lastWeekValue = lastWeekInquiries.reduce((acc, inquiry) => {
      const inquiryValue = inquiry.inquiryProducts.reduce(
        (sum, ip) => sum + Number(ip.product.price),
        0
      );
      return acc + inquiryValue;
    }, 0);

    return NextResponse.json({
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      completedInquiries,
      cancelledInquiries,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      estimatedValue: Math.round(estimatedValue),
      trends: {
        totalInquiriesTrend: totalInquiries - lastMonthInquiries,
        newInquiriesTrend: newInquiries - lastWeekNewInquiries,
        completedTrend: completedInquiries - lastWeekCompleted,
        cancelledTrend: cancelledInquiries - lastWeekCancelled,
        valueTrend: estimatedValue - lastWeekValue,
      },
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
