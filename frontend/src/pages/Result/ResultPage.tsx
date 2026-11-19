import { RefreshCw, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { RecommendationCard, SizeComparison } from "@/components/Recommendation/RecommendationCard";
import { useFitStore } from "@/store/fitStore";

export default function ResultPage() {
  const { recommendation, categoryLabel } = useFitStore();
  const navigate = useNavigate();
  if (!recommendation) return null;

  return (
    <PageTransition className="pb-16">
      <PageHeader eyebrow={categoryLabel ?? undefined} title="Your perfect fit" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RecommendationCard rec={recommendation} />
        <SizeComparison rec={recommendation} />
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" className="btn-primary" onClick={() => navigate("/shopping")}>
          <ShoppingBag className="size-4" aria-hidden /> Shop size {recommendation.recommended_size}
        </button>
        <button type="button" className="btn-ghost" onClick={() => navigate("/brands")}>
          <RefreshCw className="size-4" aria-hidden /> Try another brand
        </button>
      </div>
    </PageTransition>
  );
}
