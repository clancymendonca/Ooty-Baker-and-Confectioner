import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { logger } from "@/lib/logger";

// Middleware enforces auth for /api/inquiries/*.

export async function GET() {
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Business Inquiries");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Business Name", key: "businessName", width: 30 },
      { header: "Contact Person", key: "contactPersonName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Quantity", key: "estimatedQuantity", width: 20 },
      { header: "Frequency", key: "deliveryFrequency", width: 15 },
      { header: "Address", key: "address", width: 40 },
      { header: "Business Nature", key: "businessNature", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Products", key: "products", width: 50 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Add rows
    inquiries.forEach((inquiry) => {
      const products = inquiry.inquiryProducts
        .map((ip) => ip.product.name)
        .join(", ");

      worksheet.addRow({
        id: inquiry.id,
        businessName: inquiry.businessName,
        contactPersonName: inquiry.contactPersonName,
        email: inquiry.email,
        phone: inquiry.phone,
        estimatedQuantity: inquiry.estimatedQuantity,
        deliveryFrequency: inquiry.deliveryFrequency,
        address: inquiry.address,
        businessNature: inquiry.businessNature,
        status: inquiry.status,
        products: products,
        createdAt: inquiry.createdAt.toISOString(),
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
        "Content-Disposition": `attachment; filename=business_inquiries_${new Date().toISOString().slice(0, 10)}.xlsx`,
      },
    });
  } catch (error) {
    logger.error("Error exporting inquiries", error);
    return NextResponse.json(
      { error: "Failed to export inquiries" },
      { status: 500 }
    );
  }
}
