import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Brand } from "@/utils/types";

interface BrandCardProps {
  brand: Brand;
  favorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

/** Monogram "logo" tile — swap the monogram for real logo assets if you have licensing. */
export function BrandCard({ brand, favorite, onSelect, onToggleFavorite }: BrandCardProps) {
  const monogram = brand.name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 3);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
      <button
        type="button"
        onClick={onSelect}
        className="glass glass-hover flex w-full flex-col items-center gap-3 px-4 py-6 text-center"
      >
        <span
          className="grid size-16 place-items-center rounded-2xl text-xl font-extrabold tracking-tight shadow-lg"
          style={{ background: `linear-gradient(135deg, ${brand.color}, ${brand.color}99)` }}
          aria-hidden
        >
          {monogram}
        </span>
        <span className="font-semibold">{brand.name}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/70">{brand.fit} fit</span>
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={favorite ? `Remove ${brand.name} from favorites` : `Add ${brand.name} to favorites`}
        aria-pressed={favorite}
        className="absolute right-3 top-3 rounded-full p-2 transition hover:bg-white/10"
      >
        <Heart className={`size-5 ${favorite ? "fill-pink text-pink" : "text-white/60"}`} aria-hidden />
      </button>
    </motion.div>
  );
}
