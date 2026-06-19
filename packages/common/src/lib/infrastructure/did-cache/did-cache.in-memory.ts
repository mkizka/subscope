import type { CacheResult } from "@atproto/identity";
import type { IDidCache } from "@repo/common/domain";

export class InMemoryDidCache implements IDidCache {
  async cacheDid(): Promise<void> {}

  async checkCache(): Promise<CacheResult | null> {
    return null;
  }

  async refreshCache(): Promise<void> {}

  async clearEntry(): Promise<void> {}

  async clear(): Promise<void> {}
}
