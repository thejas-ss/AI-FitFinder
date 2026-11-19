import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, type = "text", className = "", ...props },
  ref,
) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="input-glass w-full pr-10"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 hover:text-white"
          >
            {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-pink">
          {error}
        </p>
      )}
    </div>
  );
});

export function FormAlert({ message, tone = "error" }: { message: string | null; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-sm ${tone === "error" ? "bg-pink/15 text-pink" : "bg-accent/15 text-accent"}`}
    >
      {message}
    </p>
  );
}

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main id="main" className="glass mx-auto w-full max-w-md p-8">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold">
          AI-<span className="text-gradient">FitFinder</span>
        </p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-white/70">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}
