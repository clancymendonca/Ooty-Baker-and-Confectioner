import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { consumeRateLimit } from "@/lib/rate-limit";
import { inquiryCreateSchema } from "@/lib/validators/inquiry";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET() {
  // Middleware enforces auth for /api/inquiries (non-public-POST).
  try {
    const inquiries = await prisma.businessInquiry.findMany({
      where: {
        isDeleted: false,
      },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedInquiries = inquiries.map((inquiry) => ({
      ...inquiry,
      inquiryProducts: inquiry.inquiryProducts.map((ip) => ({
        ...ip,
        product: {
          ...ip.product,
          price: Number(ip.product.price),
          pricePerGram: ip.product.pricePerGram ? Number(ip.product.pricePerGram) : null,
        },
      })),
    }));

    return NextResponse.json(serializedInquiries);
  } catch (error) {
    logger.error("Error fetching inquiries", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

/**
 * Public endpoint: anonymous visitors submit inquiries from the marketing form.
 * Protected by IP-based rate limit + strict Zod validation. No auth required.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await consumeRateLimit(`inquiry:${ip}`, {
      max: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = inquiryCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid inquiry payload",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Confirm referenced products actually exist before persisting the inquiry.
    const productCount = await prisma.product.count({
      where: { id: { in: data.productInterest } },
    });
    if (productCount !== data.productInterest.length) {
      return NextResponse.json(
        { error: "One or more selected products are no longer available." },
        { status: 400 }
      );
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.businessInquiry.create({
        data: {
          businessName: data.businessName,
          contactPersonName: data.contactPersonName,
          email: data.email,
          phone: data.phone,
          estimatedQuantity: data.estimatedQuantity,
          deliveryFrequency: data.deliveryFrequency,
          address: data.address,
          additionalNotes: data.additionalNotes || null,
          businessNature: data.businessNature,
          status: "new",
        },
      });

      await tx.businessInquiryProduct.createMany({
        data: data.productInterest.map((productId) => ({
          inquiryId: created.id,
          productId,
        })),
      });

      await tx.businessInquiryHistory.create({
        data: { inquiryId: created.id, status: "new" },
      });

      return created;
    });

    // Don't return server-managed columns to the public caller.
    return NextResponse.json(
      { success: true, id: inquiry.id },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating inquiry", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}
