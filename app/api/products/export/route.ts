import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { logger } from "@/lib/logger";

// Middleware gates /api/products/export.

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 30 },
      { header: "Description", key: "description", width: 40 },
      { header: "Variety", key: "variety", width: 20 },
      { header: "Price (₹)", key: "price", width: 15 },
      { header: "Price per Gram (₹)", key: "pricePerGram", width: 20 },
      { header: "Veg Status", key: "vegStatus", width: 15 },
      { header: "Image Path", key: "imagePath", width: 50 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Updated At", key: "updatedAt", width: 20 },
    ];

    // Add rows
    products.forEach((product) => {
      worksheet.addRow({
        id: product.id,
        name: product.name,
        description: product.description || "",
        variety: product.variety || "",
        price: Number(product.price),
        pricePerGram: product.pricePerGram ? Number(product.pricePerGram) : null,
        vegStatus: product.vegStatus,
        imagePath: product.imagePath || "",
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt?.toISOString() || product.createdAt.toISOString(),
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=products_${new Date().toISOString().slice(0, 10)}.xlsx`,
      },
    });
  } catch (error: any) {
    logger.error("Error exporting products", error, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Failed to export products",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
