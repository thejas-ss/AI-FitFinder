import { ExternalLink, ShoppingBag, Star } from "lucide-react";
import { GlassCard } from "@/components/GlassCard/GlassCard";
import { formatPrice } from "@/utils/format";
import type { Product } from "@/utils/types";

const MARKETPLACES: { key: keyof Product["marketplaces"]; label: string }[] = [
  { key: "amazon", label: "Amazon" },
  { key: "flipkart", label: "Flipkart" },
  { key: "ajio", label: "Ajio" },
  { key: "myntra", label: "Myntra" },
];

interface ProductCardProps {
  product: Product;
  onShop: (product: Product, store: string, url: string) => void;
}

export function ProductCard({ product, onShop }: ProductCardProps) {
  const open = (store: string, url: string) => {
    onShop(product, store, url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <GlassCard hover className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/5] bg-gradient-to-br from-primary/30 via-secondary/30 to-pink/30">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center">
            <ShoppingBag className="size-14 text-white/40" aria-hidden />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
          Your size: {product.recommended_size}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold leading-snug">{product.name}</h3>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
            <span className="flex items-center gap-1 text-white/70">
              <Star className="size-4 fill-yellow-400 text-yellow-400" aria-hidden />
              {product.rating}
              <span className="text-white/40">({product.reviews.toLocaleString("en-IN")})</span>
            </span>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary !py-2 text-sm" onClick={() => open("official", product.official_url)}>
            Buy Now
          </button>
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => open("official", product.official_url)}>
            Official <ExternalLink className="size-3.5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Also available on">
          {MARKETPLACES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => open(m.key, product.marketplaces[m.key])}
              className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/20"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
