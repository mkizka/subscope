import sharp from "sharp";

import { ImageBlob } from "../image-blob.js";
import type { ImagePreset } from "../image-preset.js";

export class ImageTransformationService {
  async transform(
    originalBlob: ImageBlob,
    preset: ImagePreset,
  ): Promise<ImageBlob> {
    const sharpInstance = sharp(originalBlob.data).resize(
      preset.width,
      preset.height,
      {
        fit: preset.fit,
      },
    );

    const transformedData = await sharpInstance
      .jpeg({ quality: 90 })
      .toBuffer();

    return ImageBlob.jpeg(transformedData);
  }
}
