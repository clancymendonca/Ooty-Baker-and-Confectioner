import { getSession } from "./session";
import { NextResponse } from "next/server";

/**
 * API-route auth gate. Returns either a `{ session }` payload or a `{ error }`
 * NextResponse so handlers can early-return without throwing.
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Server-component helper.
 */
export async function getCurrentUser() {
  return await getSession();
}
