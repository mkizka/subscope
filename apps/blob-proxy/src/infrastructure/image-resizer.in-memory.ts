import type { IImageResizer } from "../application/interfaces/image-resizer.js";
import type { ImageBlob } from "../domain/image-blob.js";
import type { ImagePreset } from "../domain/image-preset.js";

export class InMemoryImageResizer implements IImageResizer {
  private results: Map<string, ImageBlob> = new Map();

  setResizeResult(preset: ImagePreset, blob: ImageBlob): void {
    const key = this.getKey(preset);
    this.results.set(key, blob);
  }

  clear(): void {
    this.results.clear();
  }

  resize(params: { blob: ImageBlob; preset: ImagePreset }): Promise<ImageBlob> {
    const key = this.getKey(params.preset);
    const result = this.results.get(key);

    if (!result) {
      return Promise.reject(
        new Error(
          `No resize result set for preset type: ${params.preset.type}`,
        ),
      );
    }

    return Promise.resolve(result);
  }

  private getKey(preset: ImagePreset): string {
    return preset.type;
  }
}
