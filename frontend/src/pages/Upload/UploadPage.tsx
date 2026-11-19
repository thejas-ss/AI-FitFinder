import { ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CameraCapture } from "@/components/Camera/CameraCapture";
import { FormAlert } from "@/components/Form/Field";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { PhotoSlot } from "@/components/Upload/PhotoSlot";
import { setPendingPhotos } from "@/pages/Processing/pendingPhotos";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";
import type { PhotoView } from "@/utils/types";

const VIEWS: { id: PhotoView; label: string; required: boolean }[] = [
  { id: "front", label: "Front", required: true },
  { id: "side", label: "Side", required: false },
  { id: "back", label: "Back", required: false },
  { id: "angle45", label: "45° angle", required: false },
];

export default function UploadPage() {
  const user = useAuthStore((s) => s.user);
  const brand = useFitStore((s) => s.brand);
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Partial<Record<PhotoView, File>>>({});
  const [cameraFor, setCameraFor] = useState<PhotoView | null>(null);
  const [heightCm, setHeightCm] = useState<string>(user?.height_cm ? String(user.height_cm) : "");
  const [chestCm, setChestCm] = useState<string>("");
  const [savePhotos, setSavePhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(photos.front);
  const height = Number(heightCm);
  const heightValid = heightCm === "" || (height >= 50 && height <= 260);
  const chest = Number(chestCm);
  const chestValid = chestCm === "" || (chest >= 50 && chest <= 200);

  const setPhoto = (view: PhotoView, file: File | null) => {
    setError(null);
    setPhotos((prev) => {
      const next = { ...prev };
      if (file) next[view] = file;
      else delete next[view];
      return next;
    });
  };

  const analyze = () => {
    if (!ready) return setError("Please upload or capture one full-body front photo to continue.");
    if (!heightValid) return setError("Height must be between 50 and 260 cm.");
    if (!chestValid) return setError("Chest size must be between 50 and 200 cm.");
    setPendingPhotos({
      photos,
      heightCm: heightCm ? height : undefined,
      chestCm: chestCm ? chest : undefined,
      savePhotos,
    });
    navigate("/processing");
  };

  return (
    <PageTransition className="pb-16">
      <PageHeader
        eyebrow={brand?.name}
        title="Scan your body"
        description="One full-body front photo is enough to get started. Side, back and 45° photos are optional and can improve the estimate."
      />

      <div className="glass mx-auto mb-6 flex max-w-3xl items-start gap-3 p-4 text-sm text-white/80">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p>
          One clear front-facing, full-body photo (head to feet) is required. Stand straight with your arms slightly away
          from your body and use even lighting. Optional extra views can improve the estimate; with one photo, body depth
          is estimated, so measurements may be less accurate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {VIEWS.map((v) => (
          <PhotoSlot
            key={v.id}
            label={v.label}
            required={v.required}
            file={photos[v.id] ?? null}
            onChange={(file) => setPhoto(v.id, file)}
            onOpenCamera={() => setCameraFor(v.id)}
            onError={setError}
          />
        ))}
      </div>

      <div className="glass mx-auto mt-6 flex max-w-3xl flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="height" className="text-sm font-medium text-white/80">
            Your height (cm) — used to scale measurements
          </label>
          <input
            id="height"
            type="number"
            inputMode="decimal"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            aria-invalid={!heightValid}
            className="input-glass w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="chest" className="text-sm font-medium text-white/80">
            Chest size (cm) — optional, improves accuracy
          </label>
          <input
            id="chest"
            type="number"
            inputMode="decimal"
            value={chestCm}
            onChange={(e) => setChestCm(e.target.value)}
            aria-invalid={!chestValid}
            className="input-glass w-40"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={savePhotos} onChange={(e) => setSavePhotos(e.target.checked)} className="size-4 accent-primary" />
          Save photos to my history
        </label>
      </div>

      <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center gap-4">
        <FormAlert message={error} />
        <button type="button" className="btn-primary" disabled={!ready} onClick={analyze}>
          Analyze my fit <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      {cameraFor && (
        <CameraCapture
          viewLabel={VIEWS.find((v) => v.id === cameraFor)!.label}
          onClose={() => setCameraFor(null)}
          onCapture={(file) => {
            setPhoto(cameraFor, file);
            setCameraFor(null);
          }}
        />
      )}
    </PageTransition>
  );
}
