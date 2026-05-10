import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .refine((v) => v !== "", "Required")
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be a non-negative number");

const optionalDecimalString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v == null || v === "" ? null : v))
  .refine(
    (v) => v === null || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    "Must be a non-negative number"
  );

/**
 * Product create / update payload (multipart). The image File itself is
 * validated separately by `lib/file-upload.ts`; this schema only covers the
 * text fields extracted from FormData.
 */
export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(200),
  description: z.string().trim().max(2000).optional().nullable().transform((v) =>
    v === undefined || v === null || v === "" ? null : v
  ),
  variety: z.string().trim().max(100).optional().nullable().transform((v) =>
    v === undefined || v === null || v === "" ? null : v
  ),
  price: decimalString,
  pricePerGram: optionalDecimalString,
  vegStatus: z
    .enum(["Veg", "Non-Veg", "NonVeg"])
    .transform((v) => (v === "NonVeg" ? "Non-Veg" : v)),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function parseProductFormData(formData: FormData) {
  const data: Record<string, unknown> = {
    name: formData.get("name"),
    description: formData.get("description"),
    variety: formData.get("variety"),
    price: formData.get("price"),
    pricePerGram: formData.get("pricePerGram"),
    vegStatus: formData.get("vegStatus"),
  };

  // Coerce nulls to empty strings/undefined where the schema expects strings,
  // so users get a clean error instead of "expected string, received null".
  for (const key of Object.keys(data)) {
    if (data[key] === null) data[key] = undefined;
  }

  return productInputSchema.safeParse(data);
}
