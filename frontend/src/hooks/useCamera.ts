import { useCallback, useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "starting" | "live" | "denied" | "unsupported" | "error";

/** Wraps getUserMedia: start/stop a stream and grab a JPEG frame as a File. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  const start = useCallback(
    async (mode = facingMode) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      stop();
      setStatus("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1920 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("live");
      } catch (err) {
        setStatus(err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "error");
      }
    },
    [facingMode, stop],
  );

  const flip = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (streamRef.current) void start(next);
  }, [facingMode, start]);

  const capture = useCallback(async (filename: string): Promise<File | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    return blob ? new File([blob], filename, { type: "image/jpeg" }) : null;
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop, flip, capture };
}
