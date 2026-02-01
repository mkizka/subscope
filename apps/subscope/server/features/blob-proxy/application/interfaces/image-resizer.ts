import type { ImageBlob } from "@/server/features/blob-proxy/domain/image-blob.js";
import type { ImagePreset } from "@/server/features/blob-proxy/domain/image-preset.js";

export interface IImageResizer {
  resize: (params: {
    blob: ImageBlob;
    preset: ImagePreset;
  }) => Promise<ImageBlob>;
}
