import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CategoryCardProps {
  label: string;
  selected?: boolean;
  onSelect: () => void;
}

export function CategoryCard({ label, selected = false, onSelect }: CategoryCardProps) {
  return (
    <motion.button
      type="button"
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-pressed={selected}
      className={`glass glass-hover flex items-center justify-between gap-2 !rounded-2xl px-4 py-3 text-left text-sm font-medium ${
        selected ? "!border-accent ring-2 ring-accent/40" : ""
      }`}
    >
      <span>{label}</span>
      <ChevronRight className="size-4 shrink-0 text-white/50" aria-hidden />
    </motion.button>
  );
}
