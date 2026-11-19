import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthCard, Field, FormAlert } from "@/components/Form/Field";
import { GoogleButton } from "@/components/Form/GoogleButton";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/utils/format";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/home";

  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      const res = await authService.login(v.email, v.password, v.remember);
      setSession(res.access_token, res.user, v.remember);
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Invalid email or password."));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <AuthCard title="Welcome back" subtitle="Sign in to find your perfect fit">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <FormAlert message={error} />
          <Field label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
          <Field label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-primary" {...register("remember")} />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Sign in
          </button>
        </form>
        <div className="mt-6">
          <GoogleButton onError={setError} />
        </div>
        <p className="mt-6 text-center text-sm text-white/70">
          New here?{" "}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
