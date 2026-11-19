import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryCard } from "@/components/CategoryCard/CategoryCard";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { AUDIENCES, CATEGORIES } from "@/data/categories";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";
import type { Audience } from "@/utils/types";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { audience: savedAudience, category, selectCategory } = useFitStore();
  const [audience, setAudience] = useState<Audience>(savedAudience ?? "women");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES[audience].filter((c) => c.label.toLowerCase().includes(q));
  }, [audience, query]);

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow={user ? `Hi, ${user.name.split(" ")[0]}` : "Welcome"}
        title="What are you shopping for?"
        description="Pick a category and we'll find your exact size across 30+ brands using your body scan."
      />

      <div role="tablist" aria-label="Shop for" className="mb-8 grid gap-4 sm:grid-cols-3">
        {AUDIENCES.map((a) => {
          const active = a.id === audience;
          return (
            <motion.button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={active}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setAudience(a.id)}
              className={`glass relative overflow-hidden p-6 text-left transition ${active ? "ring-2 ring-accent" : "opacity-80 hover:opacity-100"}`}
            >
              <span aria-hidden className={`absolute -right-10 -top-10 size-40 rounded-full bg-gradient-to-br ${a.gradient} opacity-40 blur-2xl`} />
              <span className="relative block text-2xl font-bold">{a.title}</span>
              <span className="relative block text-sm text-white/70">{a.subtitle}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="relative mx-auto mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/50" aria-hidden />
        <label htmlFor="category-search" className="sr-only">
          Search categories
        </label>
        <input
          id="category-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories"
          className="input-glass w-full pl-11"
        />
      </div>

      {categories.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard
              key={c.slug}
              label={c.label}
              selected={c.slug === category && audience === savedAudience}
              onSelect={() => {
                selectCategory(audience, c.slug, c.label);
                navigate("/brands");
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-white/60">No categories match &ldquo;{query}&rdquo;.</p>
      )}

      {category && (
        <div className="mt-10 text-center">
          <button type="button" className="btn-primary" onClick={() => navigate("/brands")}>
            Continue <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </PageTransition>
  );
}
