import type { PhotoView } from "@/utils/types";

export interface PendingScan {
  photos: Partial<Record<PhotoView, File>>;
  heightCm?: number;
  chestCm?: number;
  savePhotos: boolean;
}

/**
 * File objects can't be serialized into the persisted Zustand store,
 * so the Upload page hands them to the Processing page in memory.
 */
let pending: PendingScan | null = null;

export const setPendingPhotos = (scan: PendingScan) => {
  pending = scan;
};

export const takePendingPhotos = () => {
  const scan = pending;
  pending = null;
  return scan;
};
