import { NextRequest, NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
    clearAuthSessionCookie(response);
    return response;
  } catch (error) {
    logger.error("Logout error", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
