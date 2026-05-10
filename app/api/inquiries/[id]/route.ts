import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInquiryStatusEmail } from "@/lib/email-notifications";
import { logger } from "@/lib/logger";
import { parseIdOr400 } from "@/lib/route-params";
import { inquiryUpdateSchema } from "@/lib/validators/inquiry";

// Middleware enforces auth for all /api/inquiries/* routes.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const inquiry = await prisma.businessInquiry.findUnique({
      where: { id: idResult.id },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!inquiry || inquiry.isDeleted) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const serializedInquiry = {
      ...inquiry,
      inquiryProducts: inquiry.inquiryProducts.map((ip) => ({
        ...ip,
        product: {
          ...ip.product,
          price: Number(ip.product.price),
          pricePerGram: ip.product.pricePerGram ? Number(ip.product.pricePerGram) : null,
        },
      })),
    };

    return NextResponse.json({ success: true, inquiry: serializedInquiry });
  } catch (error) {
    logger.error("Error fetching inquiry", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiry" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const json = await request.json().catch(() => null);
    const parsed = inquiryUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid update payload",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { status, staffNote } = parsed.data;

    const existingInquiry = await prisma.businessInquiry.findUnique({
      where: { id: idResult.id },
    });

    if (!existingInquiry || existingInquiry.isDeleted) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    const inquiry = await prisma.businessInquiry.update({
      where: { id: idResult.id },
      data: {
        status,
        staffNote: staffNote ?? existingInquiry.staffNote,
      },
    });

    await prisma.businessInquiryHistory.create({
      data: {
        inquiryId: inquiry.id,
        status,
      },
    });

    if (existingInquiry.status !== status) {
      sendInquiryStatusEmail({
        email: inquiry.email,
        businessName: inquiry.businessName,
        contactPersonName: inquiry.contactPersonName,
        status: inquiry.status,
        staffNote: inquiry.staffNote,
      }).catch((error) => {
        logger.error("Failed to send status email notification", error);
      });
    }

    const updatedInquiry = await prisma.businessInquiry.findUnique({
      where: { id: inquiry.id },
      include: {
        inquiryProducts: {
          include: {
            product: true,
          },
        },
      },
    });

    const serializedInquiry = updatedInquiry ? {
      ...updatedInquiry,
      inquiryProducts: updatedInquiry.inquiryProducts.map((ip) => ({
        ...ip,
        product: {
          ...ip.product,
          price: Number(ip.product.price),
          pricePerGram: ip.product.pricePerGram ? Number(ip.product.pricePerGram) : null,
        },
      })),
    } : inquiry;

    return NextResponse.json({ success: true, inquiry: serializedInquiry });
  } catch (error) {
    logger.error("Error updating inquiry", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

/**
 * Soft delete: schema has isDeleted/deletedAt and the GET filters by them.
 * Hard-delete loses audit trail and breaks history references.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const existing = await prisma.businessInquiry.findUnique({
      where: { id: idResult.id },
      select: { id: true, isDeleted: true },
    });

    if (!existing || existing.isDeleted) {
      return NextResponse.json(
        { error: "Inquiry not found" },
        { status: 404 }
      );
    }

    await prisma.businessInquiry.update({
      where: { id: idResult.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting inquiry", error);
    return NextResponse.json(
      { error: "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
