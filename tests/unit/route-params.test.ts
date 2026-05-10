import { describe, expect, it } from "vitest";
import { parseIdOr400 } from "@/lib/route-params";

describe("parseIdOr400", () => {
  it("accepts positive integers", () => {
    const result = parseIdOr400("42");
    expect(result.error).toBeUndefined();
    expect(result.id).toBe(42);
  });

  it("rejects undefined", () => {
    const result = parseIdOr400(undefined);
    expect(result.error).toBeDefined();
    expect(result.id).toBeUndefined();
  });

  it("rejects non-numeric input", () => {
    expect(parseIdOr400("abc").error).toBeDefined();
    expect(parseIdOr400("12abc").error).toBeDefined();
    expect(parseIdOr400("").error).toBeDefined();
  });

  it("rejects zero and negative numbers", () => {
    expect(parseIdOr400("0").error).toBeDefined();
    expect(parseIdOr400("-1").error).toBeDefined();
  });

  it("rejects floats", () => {
    expect(parseIdOr400("3.14").error).toBeDefined();
  });
});
