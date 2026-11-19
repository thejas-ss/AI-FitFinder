import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Audience, Brand, MeasurementResult, Recommendation } from "@/utils/types";

/** Tracks the user's progress through Home → Brand → Upload → AI → Result → Shopping. */
interface FitFlowState {
  audience: Audience | null;
  category: string | null;
  categoryLabel: string | null;
  brand: Brand | null;
  scan: MeasurementResult | null;
  recommendation: Recommendation | null;
  selectCategory: (audience: Audience, slug: string, label: string) => void;
  selectBrand: (brand: Brand) => void;
  setScan: (scan: MeasurementResult) => void;
  setRecommendation: (rec: Recommendation) => void;
  reset: () => void;
}

const initial = {
  audience: null,
  category: null,
  categoryLabel: null,
  brand: null,
  scan: null,
  recommendation: null,
};

export const useFitStore = create<FitFlowState>()(
  persist(
    (set) => ({
      ...initial,
      selectCategory: (audience, category, categoryLabel) =>
        set({ audience, category, categoryLabel, recommendation: null }),
      selectBrand: (brand) => set({ brand, recommendation: null }),
      setScan: (scan) => set({ scan, recommendation: null }),
      setRecommendation: (recommendation) => set({ recommendation }),
      reset: () => set(initial),
    }),
    // sessionStorage so a refresh mid-flow keeps progress, but nothing lingers
    { name: "fitfinder-flow", storage: createJSONStorage(() => sessionStorage) },
  ),
);
