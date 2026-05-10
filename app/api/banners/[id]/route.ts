import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile, deleteFile, validateFile } from "@/lib/file-upload";
import { logger } from "@/lib/logger";
import { parseIdOr400 } from "@/lib/route-params";

// Middleware enforces auth for non-GET /api/banners/[id] requests.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const banner = await prisma.banner.findUnique({
      where: { id: idResult.id },
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    logger.error("Error fetching banner", error);
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 });
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
    const bannerId = idResult.id;
    const existingBanner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Check if it's JSON (for order updates) or FormData (for image updates)
    const contentType = request.headers.get("content-type");
    let image: File | null = null;
    let altText: string | null = null;
    let order: number | undefined = undefined;
    let isActive: boolean | undefined = undefined;

    if (contentType?.includes("application/json")) {
      const body = await request.json();
      altText = body.altText !== undefined ? body.altText : null;
      order = body.order !== undefined ? body.order : undefined;
      isActive = body.isActive !== undefined ? body.isActive : undefined;
    } else {
      const formData = await request.formData();
      image = formData.get("image") as File | null;
      altText = formData.get("altText") ? (formData.get("altText") as string) : null;
      order = formData.get("order") ? parseInt(formData.get("order") as string) : undefined;
      isActive = formData.get("isActive") ? formData.get("isActive") === "true" : undefined;
    }

    let imagePath = existingBanner.imagePath;

    // Handle image update
    if (image && image.size > 0) {
      // Validate file
      const validation = validateFile({
        size: image.size,
        mimetype: image.type,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Delete old image
      if (existingBanner.imagePath) {
        await deleteFile(existingBanner.imagePath);
      }

      // Save new file
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await saveFile({
        buffer,
        originalFilename: image.name,
        mimetype: image.type,
      });

      if (!uploadResult.success || !uploadResult.filePath) {
        return NextResponse.json({ error: uploadResult.error || "Failed to upload image" }, { status: 500 });
      }

      imagePath = uploadResult.filePath;
    }

    // Update banner
    const banner = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        imagePath,
        altText: altText !== null ? altText : existingBanner.altText,
        order: order !== undefined ? order : existingBanner.order,
        isActive: isActive !== undefined ? isActive : existingBanner.isActive,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    logger.error("Error updating banner", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const bannerId = idResult.id;
    const banner = await prisma.banner.findUnique({
      where: { id: bannerId },
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Delete image file
    if (banner.imagePath) {
      await deleteFile(banner.imagePath);
    }

    // Delete banner from database
    await prisma.banner.delete({
      where: { id: bannerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting banner", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
