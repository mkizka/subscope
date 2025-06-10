import type { ImageBlob } from "../../domain/blob-data.js";

export interface IBlobCacheRepository {
  get: (key: string) => Promise<ImageBlob | undefined>;
  set: (key: string, value: ImageBlob) => Promise<void>;
}
