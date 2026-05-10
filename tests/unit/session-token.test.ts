import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
} from "@/lib/session-token";

describe("session-token", () => {
  const payload = {
    userId: 42,
    email: "user@example.com",
    expiresAt: new Date("2099-01-01T00:00:00Z").toISOString(),
  };

  it("round-trips a valid token", async () => {
    const token = await createSessionToken(payload);
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual(payload);
  });

  it("rejects a token with a tampered payload", async () => {
    const token = await createSessionToken(payload);
    const [version, encoded, signature] = token.split(".");
    const tamperedEncoded = encoded.replace(/.$/, "A");
    const tampered = `${version}.${tamperedEncoded}.${signature}`;
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects a token with a wrong version", async () => {
    const token = await createSessionToken(payload);
    const [, encoded, signature] = token.split(".");
    const wrongVersion = `v0.${encoded}.${signature}`;
    expect(await verifySessionToken(wrongVersion)).toBeNull();
  });

  it("rejects an invalid string", async () => {
    expect(await verifySessionToken("nope")).toBeNull();
    expect(await verifySessionToken("a.b.c")).toBeNull();
  });
});
