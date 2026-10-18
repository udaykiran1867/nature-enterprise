"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { signIn } from "@/app/admin/actions";

const schema = z.object({ email: z.email("Enter a valid email address"), password: z.string().min(1, "Enter your password") });
type Values = z.infer<typeof schema>;

const input = "field h-12 rounded-xl border-[#d6e0cf] bg-[#f1f5ee] pl-11 text-[15px] focus-visible:bg-white";
const iconCls = "pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-forest/70";

export function LoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const res = await signIn(values);
      if (!res.ok) { setError(res.error); return; }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-forest-dark"><Mail className="size-4 text-forest" aria-hidden /> Email Address</label>
        <div className="relative">
          <Mail className={iconCls} aria-hidden />
          <input id="email" type="email" autoComplete="username" placeholder="you@example.com" className={input} aria-invalid={!!errors.email} {...register("email")} />
        </div>
        {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-forest-dark"><Lock className="size-4 text-forest" aria-hidden /> Password</label>
        <div className="relative">
          <Lock className={iconCls} aria-hidden />
          <input id="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className={`${input} pr-12`} aria-invalid={!!errors.password} {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-forest/70 transition-colors hover:bg-forest/10 hover:text-forest">
            {show ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          </button>
        </div>
        {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {error && (
        <div role="alert" className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{error}</p>
        </div>
      )}

      <button type="submit" disabled={isSubmitting}
        className="btn h-12 w-full rounded-xl bg-gradient-to-b from-[#2d6a47] to-forest-dark text-base text-white shadow-lg shadow-forest/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-forest/30">
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Signing in…" : "Sign in"}
        {!isSubmitting && <ArrowRight className="size-4" aria-hidden />}
      </button>
    </form>
  );
}
