import { z } from "zod";

export const settingsSchema = z.object({
  phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  address: z.string().trim().max(300),
  whatsapp: z.string().trim().regex(/^(\d{10,15})?$/, "Digits only, with country code (e.g. 919876543210)"),
  deliveryFee: z.number({ message: "Enter a number" }).min(0).max(5000),
  lowStockDefault: z.number({ message: "Enter a number" }).int("Whole numbers only").min(0).max(1000),
  announcement: z.string().trim().max(160),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

