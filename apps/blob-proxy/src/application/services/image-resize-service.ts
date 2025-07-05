import sharp from "sharp";

import { ImageBlob } from "../../domain/image-blob.js";
import type { ImagePreset } from "../../domain/image-preset.js";

export class ImageResizeService {
  async resize({
    blob,
    preset,
  }: {
    blob: ImageBlob;
    preset: ImagePreset;
  }): Promise<ImageBlob> {
    const presetConfig = preset.getValue();

    const resizedBlob = await sharp(blob.data)
      .resize({
        width: presetConfig.width,
        height: presetConfig.height,
        fit: presetConfig.fit,
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return ImageBlob.jpeg(resizedBlob);
  }
}
