import { describe, expect, it } from "vitest";
import { inquiryCreateSchema } from "@/lib/validators/inquiry";

const validBase = {
  businessName: "Acme Pvt. Ltd.",
  contactPersonName: "Priya O'Connor",
  email: "priya@acme.example",
  phone: "9876543210",
  estimatedQuantity: "100kg",
  deliveryFrequency: "Weekly" as const,
  address: "12 MG Road, Bengaluru 560001",
  additionalNotes: "Please call before delivery.",
  businessNature: "Customer" as const,
  productInterest: [1, 2, 3],
};

describe("inquiryCreateSchema", () => {
  it("accepts a realistic submission with apostrophes and dots", () => {
    const result = inquiryCreateSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("normalizes phone numbers by stripping non-digits and leading zeros", () => {
    const result = inquiryCreateSchema.safeParse({
      ...validBase,
      phone: " 0 9876-54-3210 ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("9876543210");
    }
  });

  it("rejects invalid quantity formats", () => {
    expect(
      inquiryCreateSchema.safeParse({ ...validBase, estimatedQuantity: "lots" })
        .success
    ).toBe(false);
  });

  it("requires at least one product", () => {
    expect(
      inquiryCreateSchema.safeParse({ ...validBase, productInterest: [] })
        .success
    ).toBe(false);
  });

  it("rejects junk email", () => {
    expect(
      inquiryCreateSchema.safeParse({ ...validBase, email: "not-an-email" })
        .success
    ).toBe(false);
  });
});
