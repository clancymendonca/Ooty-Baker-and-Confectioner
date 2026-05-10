import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

// Middleware enforces auth for /api/dashboard/*.

interface Activity {
  id: string;
  type: "inquiry" | "product" | "banner";
  action: "created" | "updated" | "deleted" | "status_changed";
  description: string;
  timestamp: Date;
  entityId?: number;
}

type BusinessInquiryWithHistory = Prisma.BusinessInquiryGetPayload<{
  include: {
    history: true;
  };
}>;

export async function GET() {
  try {
    const activities: Activity[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch recent inquiries
    let recentInquiries: Prisma.BusinessInquiryGetPayload<{}>[] = [];
    try {
      recentInquiries = await prisma.businessInquiry.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      });
    } catch (error) {
      logger.error("Error fetching recent inquiries", error);
    }

    recentInquiries.forEach((inquiry) => {
      activities.push({
        id: `inquiry-${inquiry.id}-created`,
        type: "inquiry",
        action: "created",
        description: `New inquiry from ${inquiry.businessName}`,
        timestamp: inquiry.createdAt,
        entityId: inquiry.id,
      });
    });

    // Fetch inquiries with status changes (from history)
    let inquiriesWithHistory: BusinessInquiryWithHistory[] = [];
    try {
      inquiriesWithHistory = await prisma.businessInquiry.findMany({
      where: {
        isDeleted: false,
        history: {
          some: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
      include: {
        history: {
          where: {
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      take: 10,
      });
    } catch (error) {
      logger.error("Error fetching inquiries with history", error);
    }

    inquiriesWithHistory.forEach((inquiry) => {
      inquiry.history.forEach((historyItem) => {
        const statusMap: Record<string, string> = {
          new: "New",
          "in-progress": "In Progress",
          inProgress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
        };
        const statusLabel = statusMap[historyItem.status] || historyItem.status;
        activities.push({
          id: `inquiry-${inquiry.id}-status-${historyItem.id}`,
          type: "inquiry",
          action: "status_changed",
          description: `Inquiry #${inquiry.id} status changed to '${statusLabel}'`,
          timestamp: historyItem.createdAt,
          entityId: inquiry.id,
        });
      });
    });

    // Fetch recent product updates
    let recentProducts: Prisma.ProductGetPayload<{}>[] = [];
    try {
      recentProducts = await prisma.product.findMany({
      where: {
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { updatedAt: { gte: sevenDaysAgo } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      });
    } catch (error) {
      logger.error("Error fetching recent products", error);
    }

    recentProducts.forEach((product) => {
      const updatedAt = product.updatedAt || product.createdAt;
      const createdAtTime = product.createdAt.getTime();
      const updatedAtTime = updatedAt.getTime();
      const sevenDaysAgoTime = sevenDaysAgo.getTime();
      
      // Check if product was created in the last 7 days
      const isNew = !product.updatedAt || createdAtTime === updatedAtTime;
      
      if (isNew && createdAtTime >= sevenDaysAgoTime) {
        activities.push({
          id: `product-${product.id}-created`,
          type: "product",
          action: "created",
          description: `Product '${product.name}' was created`,
          timestamp: product.createdAt,
          entityId: product.id,
        });
      } else if (product.updatedAt && updatedAtTime >= sevenDaysAgoTime && updatedAtTime > createdAtTime) {
        activities.push({
          id: `product-${product.id}-updated`,
          type: "product",
          action: "updated",
          description: `Product '${product.name}' was updated`,
          timestamp: product.updatedAt,
          entityId: product.id,
        });
      }
    });

    // Fetch recent banner updates
    let recentBanners: Prisma.BannerGetPayload<{}>[] = [];
    try {
      recentBanners = await prisma.banner.findMany({
      where: {
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { updatedAt: { gte: sevenDaysAgo } },
        ],
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
      });
    } catch (error) {
      logger.error("Error fetching recent banners", error);
    }

    recentBanners.forEach((banner) => {
      const isNew = banner.createdAt.getTime() === banner.updatedAt.getTime();
      if (isNew) {
        activities.push({
          id: `banner-${banner.id}-created`,
          type: "banner",
          action: "created",
          description: `Banner '${banner.altText || `#${banner.id}`}' was created`,
          timestamp: banner.createdAt,
          entityId: banner.id,
        });
      } else if (banner.updatedAt) {
        activities.push({
          id: `banner-${banner.id}-updated`,
          type: "banner",
          action: "updated",
          description: `Banner '${banner.altText || `#${banner.id}`}' was updated`,
          timestamp: banner.updatedAt,
          entityId: banner.id,
        });
      }
    });

    // Sort all activities by timestamp (most recent first) and limit to 20
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    logger.error("Error fetching recent activities", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activities" },
      { status: 500 }
    );
  }
}
