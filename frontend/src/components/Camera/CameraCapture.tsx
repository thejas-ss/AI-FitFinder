import { Camera, RefreshCw, X } from "lucide-react";
import { useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";

interface CameraCaptureProps {
  viewLabel: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

const STATUS_TEXT: Record<string, string> = {
  starting: "Starting camera…",
  denied: "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.",
  unsupported: "This browser doesn't support camera capture. Please upload a photo instead.",
  error: "Couldn't start the camera. Please upload a photo instead.",
};

export function CameraCapture({ viewLabel, onCapture, onClose }: CameraCaptureProps) {
  const { videoRef, status, start, stop, flip, capture } = useCamera();

  useEffect(() => {
    void start();
    return stop;
    // start once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    const file = await capture(`${viewLabel.toLowerCase().replace(/\W+/g, "-")}.jpg`);
    if (file) {
      stop();
      onCapture(file);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Capture ${viewLabel} photo`} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
      <div className="glass relative w-full max-w-md overflow-hidden p-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black">
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
          {/* Silhouette guide to help users frame the full body */}
          <div aria-hidden className="pointer-events-none absolute inset-6 rounded-[40%] border-2 border-dashed border-white/40" />
          {status !== "live" && (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">
              {STATUS_TEXT[status] ?? ""}
            </p>
          )}
        </div>
        <p className="mt-3 text-center text-sm text-white/70">
          {viewLabel} view · stand 2–3 m away, full body in frame, fitted clothing
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <button type="button" onClick={onClose} className="btn-ghost !rounded-full !p-3" aria-label="Close camera">
            <X aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== "live"}
            className="btn-primary !rounded-full !p-5"
            aria-label="Capture photo"
          >
            <Camera className="size-6" aria-hidden />
          </button>
          <button type="button" onClick={flip} className="btn-ghost !rounded-full !p-3" aria-label="Switch camera">
            <RefreshCw aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
