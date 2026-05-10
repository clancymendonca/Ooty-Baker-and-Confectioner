import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { dbErrorResponse } from "@/lib/api-errors";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "developer" && session.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userIdToDelete = parseInt(id, 10);

  if (isNaN(userIdToDelete)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  if (userIdToDelete === session.id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 403 });
  }

  try {
    const userToDelete = await prisma.user.findUnique({ where: { id: userIdToDelete } });
    
    if (!userToDelete) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (session.role === "admin" && userToDelete.role === "developer") {
      return NextResponse.json({ success: false, error: "Admins cannot delete developer accounts" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: userIdToDelete } });

    logger.info(`User ${userToDelete.email} (id=${userIdToDelete}) deleted by ${session.email} (${session.role})`);
    
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return dbErrorResponse(error, "Admin delete user: DB error");
  }
}
