import type { ImageBlob } from "../../domain/image-blob.js";
import type { ImagePreset } from "../../domain/image-preset.js";

export interface IImageResizer {
  resize: (params: {
    blob: ImageBlob;
    preset: ImagePreset;
  }) => Promise<ImageBlob>;
}
