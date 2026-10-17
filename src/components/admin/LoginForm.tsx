"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { signIn } from "@/app/admin/actions";

const schema = z.object({ email: z.email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
type Values = z.infer<typeof schema>;

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
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" type="email" autoComplete="username" className="field" aria-invalid={!!errors.email} {...register("email")} />
        {errors.email && <p role="alert" className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="field pr-11" aria-invalid={!!errors.password} {...register("password")} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-forest">
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        {errors.password && <p role="alert" className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {error && (
        <div role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> <p>{error}</p>
        </div>
      )}
      <button type="submit" disabled={isSubmitting} className="btn btn-primary h-12 w-full text-base">
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />} {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
