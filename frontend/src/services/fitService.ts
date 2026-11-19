import { api } from "./api";
import type { Audience, MeasurementResult, PhotoView, Product, Recommendation } from "@/utils/types";

export const fitService = {
  analyzePhotos: (photos: Partial<Record<PhotoView, File>>, opts: { heightCm?: number; chestCm?: number; savePhotos?: boolean } = {}) => {
    const form = new FormData();
    for (const [view, file] of Object.entries(photos)) {
      if (file) form.append(view, file);
    }
    if (opts.heightCm) form.append("height_cm", String(opts.heightCm));
    if (opts.chestCm) form.append("chest_cm", String(opts.chestCm));
    form.append("save_photos", String(Boolean(opts.savePhotos)));
    return api.post<MeasurementResult>("/upload/analyze", form).then((r) => r.data);
  },

  recommend: (input: {
    brand: string;
    category: string;
    audience: Audience;
    measurements: MeasurementResult["measurements"];
    quality: number;
  }) => api.post<Recommendation>("/recommendations", input).then((r) => r.data),

  deleteRecommendation: (id: string) => api.delete(`/recommendations/${id}`),

  productsUrl: (p: { brand: string; category: string; audience: Audience; size: string }) =>
    `/shopping/products?${new URLSearchParams(p).toString()}`,

  recordPurchase: (product: Product, store: string, url: string) =>
    api.post("/history/purchases", {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      size: product.recommended_size,
      price: product.price,
      store,
      url,
    }),
};
