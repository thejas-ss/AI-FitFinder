import { Camera, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useId, useMemo, useRef } from "react";

export const MAX_FILE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface PhotoSlotProps {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  onOpenCamera: () => void;
  onError: (message: string) => void;
}

export function PhotoSlot({ label, required, file, onChange, onOpenCamera, onError }: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const accept = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!ACCEPTED.includes(candidate.type)) return onError("Please use a JPG, PNG or WebP image.");
    if (candidate.size > MAX_FILE_MB * 1024 * 1024) return onError(`Images must be under ${MAX_FILE_MB} MB.`);
    onChange(candidate);
  };

  return (
    <div
      className="glass flex flex-col gap-3 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        accept(e.dataTransfer.files[0]);
      }}
    >
      <div className="flex items-center justify-between px-1">
        <label htmlFor={inputId} className="font-semibold">
          {label}
        </label>
        <span className={`rounded-full px-2 py-0.5 text-xs ${required ? "bg-primary/30 text-white" : "bg-white/10 text-white/60"}`}>
          {required ? "Required" : "Optional"}
        </span>
      </div>

      <div className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-2xl border border-dashed border-white/25 bg-white/5">
        {preview ? (
          <img src={preview} alt={`${label} photo preview`} className="size-full object-cover" />
        ) : (
          <p className="px-4 text-center text-sm text-white/50">Drop a photo here</p>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={onOpenCamera}>
            <RotateCcw className="size-4" aria-hidden /> Retake
          </button>
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => onChange(null)}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={onOpenCamera}>
            <Camera className="size-4" aria-hidden /> Camera
          </button>
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden /> Upload
          </button>
        </div>
      )}
    </div>
  );
}
