import { NextResponse } from "next/server";

/**
 * Parse a numeric route param. Returns either a `{ id }` tuple or a `{ error }`
 * NextResponse so handlers can early-return on bad input without throwing
 * Prisma's P2023 deep in the request.
 */
export function parseIdOr400(rawId: string | undefined):
  | { id: number; error?: never }
  | { id?: never; error: NextResponse } {
  if (!rawId) {
    return {
      error: NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      ),
    };
  }

  const parsed = Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      error: NextResponse.json(
        { error: "Invalid id parameter" },
        { status: 400 }
      ),
    };
  }

  return { id: parsed };
}
