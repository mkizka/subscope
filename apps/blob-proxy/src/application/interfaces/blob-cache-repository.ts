import type { BlobData } from "../../domain/blob-data.js";

export interface IBlobCacheRepository {
  get: (key: string) => Promise<BlobData | undefined>;
  set: (key: string, value: BlobData) => Promise<void>;
}
