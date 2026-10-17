"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, MessageSquare, Phone, Tag, User } from "lucide-react";
import { sendMessage } from "@/app/(store)/contact/actions";
import { SUBJECTS, contactSchema, type ContactValues } from "@/schemas/contact";

const Err = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="mt-1 text-sm text-destructive">{msg}</p> : null);
const icon = "pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: undefined, message: "", website: "" },
  });

  async function onSubmit(v: ContactValues) {
    setError(null);
    try {
      const res = await sendMessage(v);
      if (!res.ok) { setError(res.error); return; }
      reset(); setSent(true);
    } catch { setError("We couldn't reach the server. Please try again."); }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-sage text-forest"><CheckCircle2 className="size-8" aria-hidden /></span>
        <h3 className="text-3xl">Thank you!</h3>
        <p className="max-w-sm text-muted-foreground">Your message has been sent. We&apos;ll get back to you as soon as we can.</p>
        <button type="button" className="btn btn-outline mt-2" onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="relative"><User className={icon} aria-hidden /><input {...register("name")} aria-label="Name" placeholder="Name" autoComplete="name" className="field h-12 rounded-xl pl-10" aria-invalid={!!errors.name} /></div>
          <Err msg={errors.name?.message} />
        </div>
        <div>
          <div className="relative"><Mail className={icon} aria-hidden /><input {...register("email")} type="email" aria-label="Email" placeholder="Email" autoComplete="email" className="field h-12 rounded-xl pl-10" aria-invalid={!!errors.email} /></div>
          <Err msg={errors.email?.message} />
        </div>
      </div>
      <div>
        <div className="relative"><Phone className={icon} aria-hidden /><input {...register("phone")} type="tel" inputMode="tel" aria-label="Phone number" placeholder="Phone number (optional)" autoComplete="tel" className="field h-12 rounded-xl pl-10" aria-invalid={!!errors.phone} /></div>
        <Err msg={errors.phone?.message} />
      </div>
      <div>
        <div className="relative"><Tag className={icon} aria-hidden />
          <select {...register("subject")} defaultValue="" aria-label="Subject" className="field h-12 rounded-xl pl-10" aria-invalid={!!errors.subject}>
            <option value="" disabled>Subject</option>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Err msg={errors.subject?.message} />
      </div>
      <div>
        <div className="relative"><MessageSquare className={icon} aria-hidden /><textarea {...register("message")} rows={5} aria-label="Your message" placeholder="Your message" className="field h-auto rounded-xl py-3 pl-10" aria-invalid={!!errors.message} /></div>
        <Err msg={errors.message?.message} />
      </div>
      <input {...register("website")} type="text" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {error && <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{error}</p></div>}
      <button type="submit" disabled={isSubmitting} className="btn btn-accent h-12 rounded-full px-8">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} {isSubmitting ? "Sending…" : "Send Message"} {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
