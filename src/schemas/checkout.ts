import { z } from "zod";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const checkoutFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")), "Enter a valid 10-digit Indian mobile number"),
  address: z.string().trim().min(10, "Please enter your full delivery address").max(300),
  landmark: z.string().trim().max(100),
  city: z.string().trim().min(2, "Please enter your city").max(60),
  state: z.enum(INDIAN_STATES, { message: "Please select your state" }),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  notes: z.string().trim().max(300),
});
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const orderRequestSchema = checkoutFormSchema.extend({
  idempotencyKey: z.string().min(8).max(64),
  items: z.array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(50) })).min(1).max(30),
});
export type OrderRequest = z.infer<typeof orderRequestSchema>;

/** Last 10 digits of an Indian mobile number. */
export const normalizePhone = (p: string) => p.replace(/\D/g, "").slice(-10);
