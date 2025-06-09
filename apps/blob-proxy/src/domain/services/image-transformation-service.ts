import sharp from "sharp";

import { BlobData } from "../blob-data.js";
import type { ImagePreset } from "../image-preset.js";

export class ImageTransformationService {
  async transform(
    originalBlob: BlobData,
    preset: ImagePreset,
  ): Promise<BlobData> {
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

    return BlobData.createJpeg(transformedData);
  }
}
