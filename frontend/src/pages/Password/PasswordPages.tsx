import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AuthCard, Field, FormAlert } from "@/components/Form/Field";
import { authService } from "@/services/authService";
import { errorMessage } from "@/utils/format";

const forgotSchema = z.object({ email: z.string().trim().email("Enter a valid email") });

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async ({ email }: z.infer<typeof forgotSchema>) => {
    try {
      const res = await authService.forgotPassword(email);
      setMessage({ text: res.message, tone: "success" });
    } catch (e) {
      setMessage({ text: errorMessage(e), tone: "error" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <AuthCard title="Forgot password" subtitle="We'll email you a secure reset link">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <FormAlert message={message?.text ?? null} tone={message?.tone} />
          <Field label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
          <button type="submit" className="btn-primary" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Send reset link
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}

const resetSchema = z
  .object({
    password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(token ? null : "This reset link is invalid or incomplete.");
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async ({ password }: z.infer<typeof resetSchema>) => {
    if (!token) return;
    try {
      await authService.resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (e) {
      setError(errorMessage(e, "This reset link has expired. Request a new one."));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <AuthCard title="Set a new password" subtitle="Choose something you haven't used before">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="New password" type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
          <Field label="Confirm password" type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
          <button type="submit" className="btn-primary" disabled={!token || formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Update password
          </button>
        </form>
      </AuthCard>
    </motion.div>
  );
}
