import { describe, expect, it } from "vitest";
import {
  dbErrorResponse,
  isDatabaseConnectionError,
} from "@/lib/api-errors";

describe("api-errors", () => {
  it("recognizes Prisma init / connection errors", () => {
    expect(isDatabaseConnectionError({ code: "P1001" })).toBe(true);
    expect(isDatabaseConnectionError({ code: "P1017" })).toBe(true);
    expect(
      isDatabaseConnectionError({ name: "PrismaClientInitializationError" })
    ).toBe(true);
    expect(isDatabaseConnectionError(new Error("Can't reach database"))).toBe(
      true
    );
    expect(isDatabaseConnectionError(new Error("MaxClientsInSessionMode"))).toBe(
      true
    );
  });

  it("does not flag generic errors as connection errors", () => {
    expect(isDatabaseConnectionError(new Error("validation failed"))).toBe(
      false
    );
    expect(isDatabaseConnectionError(undefined)).toBe(false);
    expect(isDatabaseConnectionError({ code: "P2002" })).toBe(false);
  });

  it("returns 503 for connection errors and 500 otherwise", async () => {
    const conn = dbErrorResponse({ code: "P1001" }, "test ctx");
    expect(conn.status).toBe(503);

    const generic = dbErrorResponse(new Error("boom"), "test ctx");
    expect(generic.status).toBe(500);
  });
});
