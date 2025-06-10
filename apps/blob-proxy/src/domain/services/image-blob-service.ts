import sharp from "sharp";

import { ImageBlob } from "../image-blob.js";
import type { ImagePreset } from "../image-preset.js";

export class ImageBlobService {
  async transform({
    blob,
    preset,
  }: {
    blob: ImageBlob;
    preset: ImagePreset;
  }): Promise<ImageBlob> {
    const presetConfig = preset.getValue();

    const transformedData = await sharp(blob.data)
      .resize({
        width: presetConfig.width,
        height: presetConfig.height,
        fit: presetConfig.fit,
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return ImageBlob.jpeg(transformedData);
  }
}
