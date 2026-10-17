import { z } from "zod";

export const SUBJECTS = ["General enquiry", "Order enquiry", "Bulk / wholesale order", "Feedback", "Other"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.email("Enter a valid email address").max(120),
  phone: z.string().trim().refine((v) => v === "" || /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")), "Enter a valid 10-digit mobile number"),
  subject: z.enum(SUBJECTS, { message: "Please choose a subject" }),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters)").max(1000, "Please keep it under 1000 characters"),
  website: z.string().max(200), // honeypot: real visitors never fill this in
});
export type ContactValues = z.infer<typeof contactSchema>;
