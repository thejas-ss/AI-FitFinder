import { useMemo, useState } from "react";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { ProductCard } from "@/components/ProductCard/ProductCard";
import { useProducts } from "@/hooks/useApi";
import { fitService } from "@/services/fitService";
import { useFitStore } from "@/store/fitStore";

type Sort = "relevance" | "price-asc" | "price-desc" | "rating";

export default function ShoppingPage() {
  const { recommendation, categoryLabel } = useFitStore();
  const [sort, setSort] = useState<Sort>("relevance");
  const url = recommendation
    ? fitService.productsUrl({
        brand: recommendation.brand,
        category: recommendation.category,
        audience: recommendation.audience,
        size: recommendation.recommended_size,
      })
    : null;
  const { data, error, isLoading } = useProducts(url);

  const products = useMemo(() => {
    const list = [...(data ?? [])];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [data, sort]);

  if (!recommendation) return null;

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow={`${recommendation.brand_name} · Size ${recommendation.recommended_size}`}
        title={`${categoryLabel ?? "Products"} in your size`}
        description="Buy from the official store or compare across marketplaces."
      />

      <div className="mb-6 flex justify-end">
        <label htmlFor="sort" className="sr-only">
          Sort products
        </label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input-glass">
          <option value="relevance">Most relevant</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error ? (
        <p role="alert" className="text-center text-pink">Couldn&apos;t load products. Please refresh.</p>
      ) : isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="glass aspect-[3/5] animate-pulse" />
          ))}
        </div>
      ) : products.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onShop={(prod, store, link) => void fitService.recordPurchase(prod, store, link).catch(() => {})} />
          ))}
        </div>
      ) : (
        <p className="text-center text-white/60">No products found for this size yet.</p>
      )}
    </PageTransition>
  );
}
