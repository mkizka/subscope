import type { BlobData } from "../../shared/types.js";

export interface IBlobCacheRepository {
  get: (key: string) => Promise<BlobData | undefined>;
  set: (key: string, value: BlobData) => Promise<void>;
}
