import type { CacheResult, DidCache, DidDocument } from "@atproto/identity";
import KeyvRedis from "@keyv/redis";
import Keyv from "keyv";

import type { IMetric } from "../../application/interfaces/metric.js";
import { env } from "../../shared/env.js";

type CacheVal = {
  doc: DidDocument;
  updatedAt: number;
};

const TTL = 30 * 24 * 60 * 60 * 1000;

export class RedisDidCache implements DidCache {
  private readonly cache: Keyv<CacheVal>;

  constructor(private readonly metric: IMetric) {
    this.cache = new Keyv({
      namespace: "did-cache",
      // https://github.com/jaredwray/keyv/issues/1255
      useKeyPrefix: false,
      store: new KeyvRedis<CacheVal>(env.REDIS_URL),
    });
  }
  static inject = ["metric"] as const;

  async cacheDid(did: string, doc: DidDocument): Promise<void> {
    await this.cache.set(did, { doc, updatedAt: Date.now() }, TTL);
  }

  async checkCache(did: string): Promise<CacheResult | null> {
    const val = await this.cache.get(did);
    if (!val) {
      this.metric.increment({
        name: "did_cache_miss_total",
        help: "Total number of did resolver cache misses",
      });
      return null;
    }
    this.metric.increment({
      name: "did_cache_hit_total",
      help: "Total number of did resolver cache hits",
    });
    return {
      ...val,
      did,
      stale: false,
      expired: false, // expiring is handled by redis
    };
  }

  async refreshCache(
    did: string,
    getDoc: () => Promise<DidDocument | null>,
  ): Promise<void> {
    const doc = await getDoc();
    if (doc) {
      await this.cacheDid(did, doc);
    }
  }

  async clearEntry(did: string): Promise<void> {
    await this.cache.delete(did);
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }
}
