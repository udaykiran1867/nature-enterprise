import { z } from "zod";

export const settingsSchema = z.object({
  phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  address: z.string().trim().max(300),
  whatsapp: z.string().trim().regex(/^(\d{10,15})?$/, "Digits only, with country code (e.g. 919876543210)"),
  deliveryFee: z.number({ message: "Enter a number" }).min(0).max(5000),
  lowStockDefault: z.number({ message: "Enter a number" }).int("Whole numbers only").min(0).max(1000),
  announcement: z.string().trim().max(160),
  // Name shown under the QR code on the payment page. Empty = the shop name.
  payeeName: z.string().trim().max(80),
  // Storage path of the uploaded QR image (always under payment/), or empty.
  qrImage: z.string().trim().regex(/^(payment\/[A-Za-z0-9._-]{1,120})?$/, "Invalid QR image"),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

