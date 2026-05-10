import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFile, saveFile, deleteFile } from "@/lib/file-upload";
import { logger } from "@/lib/logger";
import { parseIdOr400 } from "@/lib/route-params";

// Middleware enforces auth for non-GET /api/products/[id] requests.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const idResult = parseIdOr400(rawId);
  if (idResult.error) return idResult.error;

  try {
    const product = await prisma.product.findUnique({
      where: { id: idResult.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Convert Decimal to number for JSON serialization
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
    };

    return NextResponse.json({ success: true, product: serializedProduct });
  } catch (error) {
    logger.error("Error fetching product", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
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
    const existingProduct = await prisma.product.findUnique({
      where: { id: idResult.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const variety = formData.get("variety") as string;
    const price = parseFloat(formData.get("price") as string);
    const pricePerGram = formData.get("pricePerGram")
      ? parseFloat(formData.get("pricePerGram") as string)
      : null;
    const vegStatus = formData.get("vegStatus") as string;
    const imageFile = formData.get("image") as File | null;

    // Normalize vegStatus - accept both "NonVeg" and "Non-Veg"
    const normalizedVegStatus = vegStatus === "NonVeg" ? "Non-Veg" : vegStatus;

    let imagePath: string | null = existingProduct.imagePath;

    // Handle image upload if new image is provided
    if (imageFile && imageFile.size > 0) {
      const validation = validateFile({
        size: imageFile.size,
        mimetype: imageFile.type,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await saveFile({
        buffer,
        originalFilename: imageFile.name,
        mimetype: imageFile.type,
      });

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || "Failed to upload image" },
          { status: 500 }
        );
      }

      // Delete old image if it exists
      if (existingProduct.imagePath) {
        await deleteFile(existingProduct.imagePath);
      }

      imagePath = uploadResult.filePath || null;
    }

    const product = await prisma.product.update({
      where: { id: idResult.id },
      data: {
        name,
        description,
        variety,
        price,
        pricePerGram,
        vegStatus: normalizedVegStatus,
        imagePath,
      },
    });

    // Convert Decimal to number for JSON serialization
    const serializedProduct = {
      ...product,
      price: Number(product.price),
      pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
    };

    return NextResponse.json({ success: true, product: serializedProduct });
  } catch (error) {
    logger.error("Error updating product", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
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
    const product = await prisma.product.findUnique({
      where: { id: idResult.id },
    });

    if (product) {
      if (product.imagePath) {
        await deleteFile(product.imagePath);
      }

      await prisma.product.delete({
        where: { id: idResult.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting product", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
