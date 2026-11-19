import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthCard, Field, FormAlert } from "@/components/Form/Field";
import { GoogleButton } from "@/components/Form/GoogleButton";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { errorMessage } from "@/utils/format";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().regex(/^\+?[0-9 ]{10,15}$/, "Enter a valid phone number"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
    gender: z.enum(["male", "female", "other"], { errorMap: () => ({ message: "Select a gender" }) }),
    date_of_birth: z.string().refine((d) => {
      const date = new Date(d);
      return !Number.isNaN(date.getTime()) && date < new Date();
    }, "Enter a valid date of birth"),
    height_cm: z.coerce.number().min(50, "Height in cm (50–260)").max(260, "Height in cm (50–260)"),
    weight_kg: z.coerce.number().min(10, "Weight in kg (10–300)").max(300, "Weight in kg (10–300)"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const genderId = useId();

  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });
  const err = formState.errors;

  const onSubmit = async ({ confirm: _confirm, ...payload }: Values) => {
    setError(null);
    try {
      const res = await authService.register(payload);
      setSession(res.access_token, res.user, true);
      navigate("/home", { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Could not create your account."));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <AuthCard title="Create your account" subtitle="Your measurements stay private to you">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormAlert message={error} />
          </div>
          <Field className="sm:col-span-2" label="Full name" autoComplete="name" error={err.name?.message} {...register("name")} />
          <Field className="sm:col-span-2" label="Email" type="email" autoComplete="email" error={err.email?.message} {...register("email")} />
          <Field className="sm:col-span-2" label="Phone" type="tel" autoComplete="tel" error={err.phone?.message} {...register("phone")} />
          <Field label="Password" type="password" autoComplete="new-password" error={err.password?.message} {...register("password")} />
          <Field label="Confirm password" type="password" autoComplete="new-password" error={err.confirm?.message} {...register("confirm")} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor={genderId} className="text-sm font-medium text-white/80">
              Gender
            </label>
            <select id={genderId} className="input-glass" defaultValue="" aria-invalid={Boolean(err.gender)} {...register("gender")}>
              <option value="" disabled>
                Select
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {err.gender && <p role="alert" className="text-xs text-pink">{err.gender.message}</p>}
          </div>
          <Field label="Date of birth" type="date" error={err.date_of_birth?.message} {...register("date_of_birth")} />
          <Field label="Height (cm)" type="number" inputMode="decimal" error={err.height_cm?.message} {...register("height_cm")} />
          <Field label="Weight (kg)" type="number" inputMode="decimal" error={err.weight_kg?.message} {...register("weight_kg")} />

          <button type="submit" className="btn-primary mt-2 sm:col-span-2" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Create account
          </button>
        </form>
        <div className="mt-6">
          <GoogleButton onError={setError} />
        </div>
        <p className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}
