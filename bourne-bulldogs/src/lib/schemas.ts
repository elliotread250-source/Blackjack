import { z } from "zod";
import { merch, type ProductId } from "@/content/site";

const phone = z
  .string()
  .trim()
  .max(20, "That phone number looks too long")
  .regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only");

/** Honeypot: real people never see or fill this field. */
const honeypot = z.string().max(0).optional();

export const enquiryValues = ["join", "merch", "general", "other"] as const;

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Please tell us your name").max(80, "That's a long name, please shorten it"),
    email: z.email("Please enter a valid email address").max(120),
    phone: phone.optional().or(z.literal("")),
    enquiry: z.enum(enquiryValues, { error: "Pick what your message is about" }),
    childAge: z.string().trim().optional(),
    message: z.string().trim().min(10, "A few more words please (10 characters minimum)").max(2000, "Please keep it under 2000 characters"),
    company: honeypot,
  })
  .superRefine((v, ctx) => {
    if (v.enquiry !== "join") return;
    const age = Number(v.childAge);
    if (!v.childAge || !Number.isInteger(age) || age < 8 || age > 16) {
      ctx.addIssue({ code: "custom", path: ["childAge"], message: "Our sessions are for ages 8 to 16" });
    }
  });

export type ContactInput = z.infer<typeof contactSchema>;

const productIds = merch.products.map((p) => p.id) as [ProductId, ...ProductId[]];

export const orderSchema = z
  .object({
    parentName: z.string().trim().min(2, "Please tell us your name").max(80),
    email: z.email("Please enter a valid email address").max(120),
    phone: phone.min(10, "We need a phone number to confirm your order"),
    product: z.enum(productIds, { error: "Choose a product" }),
    size: z.string().trim().min(1, "Choose a size"),
    quantity: z.coerce.number().int("Whole numbers only").min(1, "At least 1").max(10, "For more than 10, get in touch"),
    supporter: z.boolean().default(false),
    surname: z
      .string()
      .trim()
      .toUpperCase()
      .max(12, "12 characters maximum")
      .regex(/^[A-Z' -]*$/, "Letters, spaces, hyphens and apostrophes only")
      .optional()
      .or(z.literal("")),
    number: z
      .string()
      .trim()
      .regex(/^\d{0,2}$/, "A number from 00 to 99")
      .optional()
      .or(z.literal("")),
    notes: z.string().trim().max(1000, "Please keep notes under 1000 characters").optional().or(z.literal("")),
    company: honeypot,
  })
  .superRefine((v, ctx) => {
    const product = merch.products.find((p) => p.id === v.product);
    if (product && !product.sizes.includes(v.size)) {
      ctx.addIssue({ code: "custom", path: ["size"], message: `Choose a ${product.audience === "kids" ? "kids" : "adult"} size` });
    }
    if (v.supporter && (v.surname || v.number)) {
      ctx.addIssue({ code: "custom", path: ["surname"], message: "Supporter tops can't have a name or number" });
    }
  })
  .transform((v) => ({
    ...v,
    surname: v.supporter ? "" : (v.surname ?? ""),
    number: v.supporter || !v.number ? "" : v.number.padStart(2, "0"),
  }));

export type OrderInput = z.input<typeof orderSchema>;
export type Order = z.output<typeof orderSchema>;

/** Flatten Zod issues to { field: firstMessage } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
