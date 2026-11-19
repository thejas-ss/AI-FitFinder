import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormAlert } from "@/components/Form/Field";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { fitService } from "@/services/fitService";
import { useFitStore } from "@/store/fitStore";
import { errorMessage } from "@/utils/format";
import { takePendingPhotos } from "./pendingPhotos";

const STEPS = [
  "Uploading photos securely",
  "Detecting body landmarks",
  "Estimating measurements",
  "Matching brand size chart",
];

export default function ProcessingPage() {
  const navigate = useNavigate();
  const { brand, category, audience, scan, setScan, setRecommendation } = useFitStore();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in dev; only run the pipeline once.
    if (started.current) return;
    started.current = true;

    const pending = takePendingPhotos();
    if (!pending && !scan) {
      navigate("/upload", { replace: true });
      return;
    }

    const run = async () => {
      try {
        let result = scan;
        if (pending) {
          setStep(1);
          result = await fitService.analyzePhotos(pending.photos, pending);
          setScan(result);
        }
        setStep(2);
        if (!result || !brand || !category || !audience) throw new Error("missing step");
        setStep(3);
        const rec = await fitService.recommend({
          brand: brand.slug,
          category,
          audience,
          measurements: result.measurements,
          quality: result.quality,
        });
        setRecommendation(rec);
        setStep(STEPS.length);
        setTimeout(() => navigate("/result", { replace: true }), 500);
      } catch (e) {
        setError(errorMessage(e, "We couldn't analyze those photos. Try clearer, full-body shots."));
      }
    };
    void run();
  }, [audience, brand, category, navigate, scan, setRecommendation, setScan]);

  return (
    <PageTransition className="grid min-h-[60vh] place-items-center pb-16">
      <div className="glass w-full max-w-md p-8 text-center">
        <div className="relative mx-auto mb-6 size-32" aria-hidden>
          <motion.span
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-secondary to-pink blur-xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span
            className="absolute inset-3 rounded-full border-4 border-white/20 border-t-accent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <h1 className="text-2xl font-bold">Analyzing your fit</h1>
        <ol className="mt-6 flex flex-col gap-3 text-left" aria-live="polite">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step && !error;
            return (
              <li key={label} className={`flex items-center gap-3 ${done || active ? "text-white" : "text-white/40"}`}>
                <span className={`grid size-6 place-items-center rounded-full ${done ? "bg-accent text-base" : "bg-white/10"}`}>
                  {done ? <Check className="size-4" aria-hidden /> : active ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
        {error && (
          <div className="mt-6 flex flex-col gap-3">
            <FormAlert message={error} />
            <button type="button" className="btn-primary" onClick={() => navigate("/upload", { replace: true })}>
              Retake photos
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
