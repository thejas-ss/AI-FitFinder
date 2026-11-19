import useSWR from "swr";
import { fetcher } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import type { Brand, MeasurementResult, Product, Purchase, Recommendation, User } from "@/utils/types";

export const BRAND_SEGMENTS = [
  "sportswear", "casual", "denim", "formal", "premium", "fast-fashion", "luxury", "ethnic",
] as const;

export function useBrands(search = "", segment?: string | null) {
  const params = new URLSearchParams();
  if (segment) params.set("segment", segment);
  if (search.trim()) params.set("q", search.trim());
  const query = params.toString();
  return useSWR<Brand[]>(`/brands${query ? `?${query}` : ""}`, fetcher, { keepPreviousData: true });
}

export function useMe() {
  const token = useAuthStore((s) => s.token);
  return useSWR<User>(token ? "/users/me" : null, fetcher);
}

export function useMeasurements() {
  return useSWR<MeasurementResult[]>("/history/measurements", fetcher);
}

export function useRecommendations() {
  return useSWR<Recommendation[]>("/recommendations", fetcher);
}

export function usePurchases() {
  return useSWR<Purchase[]>("/history/purchases", fetcher);
}

export function useProducts(url: string | null) {
  return useSWR<Product[]>(url, fetcher);
}
