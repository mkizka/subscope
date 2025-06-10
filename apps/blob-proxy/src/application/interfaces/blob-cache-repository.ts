import type { ImageBlob } from "../../domain/image-blob.js";

export interface IBlobCacheRepository {
  get: (key: string) => Promise<ImageBlob | undefined>;
  set: (key: string, value: ImageBlob) => Promise<void>;
}
