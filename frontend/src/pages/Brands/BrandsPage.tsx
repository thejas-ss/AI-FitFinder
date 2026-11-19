import { Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandCard } from "@/components/BrandCard/BrandCard";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { BRAND_SEGMENTS, useBrands, useMe } from "@/hooks/useApi";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";

export default function BrandsPage() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const { data: brands, error, isLoading } = useBrands(deferredSearch, segment);
  const { data: me, mutate: mutateMe } = useMe();
  const setUser = useAuthStore((s) => s.setUser);
  const { categoryLabel, selectBrand } = useFitStore();
  const navigate = useNavigate();

  const favorites = new Set(me?.favorite_brands ?? []);
  const visible = (brands ?? []).filter((b) => !favoritesOnly || favorites.has(b.slug));

  const toggleFavorite = async (slug: string) => {
    if (!me) return;
    const next = favorites.has(slug) ? me.favorite_brands.filter((s) => s !== slug) : [...me.favorite_brands, slug];
    await mutateMe(
      async () => {
        const user = await authService.toggleFavorite(slug);
        setUser(user);
        return user;
      },
      { optimisticData: { ...me, favorite_brands: next }, rollbackOnError: true, revalidate: false },
    );
  };

  return (
    <PageTransition className="pb-16">
      <PageHeader eyebrow={categoryLabel ?? "Brands"} title="Choose a brand" description="Every brand sizes differently — we use each one's own size chart." />

      <div className="mb-6 flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/50" aria-hidden />
          <label htmlFor="brand-search" className="sr-only">
            Search brands
          </label>
          <input id="brand-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brands" className="input-glass w-full pl-11" />
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Filter brands">
          <FilterChip active={!segment && !favoritesOnly} onClick={() => { setSegment(null); setFavoritesOnly(false); }}>
            All
          </FilterChip>
          <FilterChip active={favoritesOnly} onClick={() => setFavoritesOnly((f) => !f)}>
            Favorites
          </FilterChip>
          {BRAND_SEGMENTS.map((s) => (
            <FilterChip key={s} active={segment === s} onClick={() => setSegment(segment === s ? null : s)}>
              {s.replace("-", " ")}
            </FilterChip>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-center text-pink">Couldn&apos;t load brands. Please refresh.</p>
      ) : isLoading && !brands ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-busy="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="glass h-36 animate-pulse" />
          ))}
        </div>
      ) : visible.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((brand) => (
            <BrandCard
              key={brand.slug}
              brand={brand}
              favorite={favorites.has(brand.slug)}
              onToggleFavorite={() => void toggleFavorite(brand.slug)}
              onSelect={() => {
                selectBrand(brand);
                navigate("/upload");
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-white/60">No brands match your filters.</p>
      )}
    </PageTransition>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm capitalize transition ${active ? "bg-white text-base font-semibold" : "bg-white/10 text-white/80 hover:bg-white/20"}`}
    >
      {children}
    </button>
  );
}
