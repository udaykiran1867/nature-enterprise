import { z } from "zod";
import { UPI_ID_RE } from "@/lib/payments";

export const settingsSchema = z.object({
  phone: z.string().trim().max(30),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  address: z.string().trim().max(300),
  whatsapp: z.string().trim().regex(/^(\d{10,15})?$/, "Digits only, with country code (e.g. 919876543210)"),
  deliveryFee: z.number({ message: "Enter a number" }).min(0).max(5000),
  lowStockDefault: z.number({ message: "Enter a number" }).int("Whole numbers only").min(0).max(1000),
  announcement: z.string().trim().max(160),
  codEnabled: z.boolean(),
  upiEnabled: z.boolean(),
  codMaxAmount: z.number({ message: "Enter a number" }).min(0, "Cannot be negative").max(1000000),
  upiId: z.string().trim().max(120),
  upiPayeeName: z.string().trim().max(60),
}).superRefine((v, ctx) => {
  if (v.upiId && !UPI_ID_RE.test(v.upiId)) ctx.addIssue({ code: "custom", path: ["upiId"], message: "Enter a valid UPI ID, like name@bank" });
  if (v.upiEnabled && !v.upiId) ctx.addIssue({ code: "custom", path: ["upiId"], message: "Enter your UPI ID to accept UPI payments" });
  if (v.upiEnabled && !v.upiPayeeName) ctx.addIssue({ code: "custom", path: ["upiPayeeName"], message: "Enter the name customers will see when paying" });
  if (!v.codEnabled && !v.upiEnabled) ctx.addIssue({ code: "custom", path: ["codEnabled"], message: "Keep at least one payment method turned on" });
});
export type SettingsValues = z.infer<typeof settingsSchema>;

