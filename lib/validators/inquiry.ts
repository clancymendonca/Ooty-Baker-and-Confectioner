import { z } from "zod";

/**
 * Server-side inquiry payload schema.
 *
 * Length-only validation on free-text name fields (no character-class regexes)
 * so we don't reject legitimate Indian business / personal names like
 * "O'Connor", "Pvt. Ltd.", "D-Mart", or non-Latin scripts.
 *
 * Phone is normalized to digits-only by stripping non-digits and leading zeros
 * before length validation; storage layer can decide on E.164 later.
 */
export const inquiryCreateSchema = z.object({
  businessName: z.string().trim().min(2).max(100),
  contactPersonName: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "").replace(/^0+/, ""))
    .pipe(z.string().regex(/^[0-9]{10,15}$/, "Phone must be 10-15 digits")),
  estimatedQuantity: z
    .string()
    .trim()
    .max(50)
    .regex(
      /^[0-9]+(\.[0-9]+)?\s?(kg|units|pieces|boxes|packs|dozens|g|ml|l)$/i,
      "Use format like 100kg, 500 units, or 1.5kg"
    ),
  deliveryFrequency: z.enum(["One-time", "Weekly", "Monthly"]),
  address: z.string().trim().min(10).max(200),
  additionalNotes: z.string().trim().max(500).optional().or(z.literal("")),
  businessNature: z.enum(["Customer", "Consumer", "Dealer"]),
  productInterest: z
    .array(z.number().int().positive())
    .min(1, "Please select at least one product")
    .max(50),
});

export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;

export const inquiryUpdateSchema = z.object({
  status: z.enum(["new", "in-progress", "inProgress", "completed", "cancelled"]),
  staffNote: z.string().max(2000).optional().nullable(),
});

export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>;
