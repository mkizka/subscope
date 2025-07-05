import sharp from "sharp";

import type { IImageResizer } from "../application/interfaces/image-resizer.js";
import { ImageBlob } from "../domain/image-blob.js";
import type { ImagePreset } from "../domain/image-preset.js";

export class ImageResizer implements IImageResizer {
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
