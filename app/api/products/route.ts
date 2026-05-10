import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFile, saveFile } from "@/lib/file-upload";
import { logger } from "@/lib/logger";

// Middleware enforces auth for non-GET /api/products requests.

export const maxDuration = 30;
export const runtime = 'nodejs';

const PUBLIC_PRODUCT_SELECT = {
  id: true,
  name: true,
  description: true,
  imagePath: true,
  price: true,
  variety: true,
  pricePerGram: true,
  vegStatus: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: PUBLIC_PRODUCT_SELECT,
    });

    const serializedProducts = products.map((product) => ({
      ...product,
      price: Number(product.price),
      pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
    }));

    return NextResponse.json(serializedProducts, { status: 200 });
  } catch (error: any) {
    logger.error("Error fetching products", error);

    let userFriendlyMessage = error?.message || "Failed to fetch products";
    if (
      userFriendlyMessage?.includes("MaxClientsInSessionMode") ||
      userFriendlyMessage?.includes("max clients")
    ) {
      userFriendlyMessage =
        "Database connection limit reached. Please use Transaction mode (port 6543) instead of Session mode (port 5432).";
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        code: error?.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const variety = formData.get("variety") as string;
    const priceStr = formData.get("price") as string;
    const pricePerGramStr = formData.get("pricePerGram") as string | null;
    const vegStatus = formData.get("vegStatus") as string;
    const imageFile = formData.get("image") as File | null;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (!priceStr || isNaN(parseFloat(priceStr))) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const price = parseFloat(priceStr);
    if (price < 0) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }

    const pricePerGram =
      pricePerGramStr && pricePerGramStr.trim() !== ""
        ? parseFloat(pricePerGramStr)
        : null;

    if (pricePerGram !== null && (isNaN(pricePerGram) || pricePerGram < 0)) {
      return NextResponse.json({ error: "Price per gram must be a positive number" }, { status: 400 });
    }

    // Normalize vegStatus - accept both "NonVeg" and "Non-Veg"
    const normalizedVegStatus = vegStatus === "NonVeg" ? "Non-Veg" : vegStatus;

    if (!normalizedVegStatus || (normalizedVegStatus !== "Veg" && normalizedVegStatus !== "Non-Veg")) {
      return NextResponse.json({ error: "Veg status must be 'Veg' or 'Non-Veg'" }, { status: 400 });
    }

    let imagePath: string | null = null;

    if (imageFile && imageFile.size > 0) {
      try {
        const { isSupabaseConfigured } = await import("@/lib/supabase-storage");
        const { isVercelBlobConfigured } = await import("@/lib/vercel-blob-storage");
        if (process.env.VERCEL && !isSupabaseConfigured() && !isVercelBlobConfigured()) {
          return NextResponse.json(
            {
              error: "File uploads require cloud storage to be configured",
              hint: "Add BLOB_READ_WRITE_TOKEN (Vercel Blob) or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase) to your Vercel environment variables.",
            },
            { status: 500 }
          );
        }

        const validation = validateFile({
          size: imageFile.size,
          mimetype: imageFile.type,
        });

        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        logger.info("Uploading product image", {
          filename: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
        });

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadResult = await saveFile({
          buffer,
          originalFilename: imageFile.name,
          mimetype: imageFile.type,
        });

        if (!uploadResult.success) {
          logger.error("File upload failed", {
            error: uploadResult.error,
            hint: uploadResult.hint,
            filename: imageFile.name,
            size: imageFile.size,
          });
          return NextResponse.json(
            {
              error: uploadResult.error || "Failed to upload image",
              hint: uploadResult.hint,
            },
            { status: 500 }
          );
        }

        imagePath = uploadResult.filePath || null;
      } catch (error: any) {
        logger.error("Error uploading image", error);
        return NextResponse.json(
          {
            error: `Image upload failed: ${error?.message || "Unknown error"}`,
            hint: process.env.VERCEL
              ? "Make sure cloud storage is configured in Vercel environment variables."
              : undefined,
          },
          { status: 500 }
        );
      }
    }

    try {
      const normalizedDescription =
        description && description.trim() !== "" ? description.trim() : null;
      const normalizedVariety =
        variety && variety.trim() !== "" ? variety.trim() : null;

      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          description: normalizedDescription,
          variety: normalizedVariety,
          price,
          pricePerGram,
          vegStatus: normalizedVegStatus,
          imagePath,
        },
      });

      logger.info("Product created", { productId: product.id });

      const serializedProduct = {
        ...product,
        price: Number(product.price),
        pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
      };

      return NextResponse.json({ success: true, product: serializedProduct }, { status: 201 });
    } catch (dbError: any) {
      logger.error("Database error creating product", dbError);

      if (dbError?.code === "P2002") {
        return NextResponse.json(
          { success: false, error: "A product with this name already exists" },
          { status: 400 }
        );
      }

      let userFriendlyMessage = dbError?.message || "Failed to create product";
      if (
        userFriendlyMessage?.includes("MaxClientsInSessionMode") ||
        userFriendlyMessage?.includes("max clients")
      ) {
        userFriendlyMessage =
          "Database connection limit reached. Please use Transaction mode (port 6543) instead of Session mode (port 5432).";
      }

      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${userFriendlyMessage}`,
          code: dbError?.code || "UNKNOWN",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error("Error in POST /api/products", error);

    let userFriendlyMessage = error?.message || "Failed to create product";
    if (
      userFriendlyMessage?.includes("MaxClientsInSessionMode") ||
      userFriendlyMessage?.includes("max clients")
    ) {
      userFriendlyMessage =
        "Database connection limit reached. Please use Transaction mode (port 6543) instead of Session mode (port 5432).";
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyMessage,
        code: error?.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}
