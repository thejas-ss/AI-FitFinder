import { motion } from "framer-motion";
import type { Measurements, Recommendation } from "@/utils/types";

const MEASUREMENT_LABELS: [keyof Measurements, string][] = [
  ["chest", "Chest"],
  ["waist", "Waist"],
  ["hip", "Hip"],
  ["shoulder", "Shoulder"],
  ["sleeve", "Sleeve"],
  ["inseam", "Inseam"],
];

export function ConfidenceRing({ value }: { value: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative size-28" role="img" aria-label={`Confidence ${value} percent`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0%" stopColor="#00D2FF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-2xl font-bold">{value}%</span>
    </div>
  );
}

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <section aria-labelledby="rec-title" className="glass overflow-hidden">
      <div className="flex flex-col items-center gap-6 bg-gradient-to-br from-primary/30 via-secondary/20 to-pink/20 p-8 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm uppercase tracking-widest text-white/70">{rec.brand_name}</p>
          <h2 id="rec-title" className="mt-1 text-lg text-white/80">
            Recommended size
          </h2>
          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="text-gradient text-7xl font-extrabold"
          >
            {rec.recommended_size}
          </motion.p>
          <p className="mt-2 max-w-sm text-sm text-white/70">{rec.fit_note}</p>
        </div>
        <ConfidenceRing value={rec.confidence} />
      </div>

      <dl className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
        {MEASUREMENT_LABELS.map(([key, label]) => {
          const value = rec.measurements[key];
          if (value == null) return null;
          return (
            <div key={key} className="rounded-2xl bg-white/5 p-4">
              <dt className="text-xs uppercase tracking-wider text-white/60">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {Math.round(value)} <span className="text-sm text-white/60">cm</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function SizeComparison({ rec }: { rec: Recommendation }) {
  return (
    <section aria-labelledby="compare-title" className="glass p-6">
      <h2 id="compare-title" className="text-lg font-semibold">
        Size comparison
      </h2>
      <p className="text-sm text-white/60">Your size varies by brand because each one cuts differently.</p>
      <ul className="mt-4 divide-y divide-white/10">
        {rec.comparison.map((m) => (
          <li key={m.brand} className="flex items-center justify-between py-3">
            <span className={m.brand === rec.brand ? "font-semibold text-accent" : ""}>{m.brand_name}</span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-white/50">{m.confidence}%</span>
              <span className="min-w-12 rounded-full bg-white/10 px-3 py-1 text-center font-semibold">{m.size}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
