import type { CacheResult, DidCache, DidDocument } from "@atproto/identity";
import KeyvRedis from "@keyv/redis";
import type { IMetricReporter } from "@repo/common/domain";
import Keyv from "keyv";

type CacheVal = {
  doc: DidDocument;
  updatedAt: number;
};

const TTL = 30 * 24 * 60 * 60 * 1000;

export class RedisDidCache implements DidCache {
  private readonly cache: Keyv<CacheVal>;

  constructor(
    redisUrl: string,
    private readonly metricReporter: IMetricReporter,
  ) {
    this.cache = new Keyv({
      namespace: "did-cache",
      // https://github.com/jaredwray/keyv/issues/1255
      useKeyPrefix: false,
      store: new KeyvRedis<CacheVal>(redisUrl),
    });
  }
  static inject = ["redisUrl", "metricReporter"] as const;

  async cacheDid(did: string, doc: DidDocument): Promise<void> {
    await this.cache.set(did, { doc, updatedAt: Date.now() }, TTL);
  }

  async checkCache(did: string): Promise<CacheResult | null> {
    const val = await this.cache.get(did);
    if (!val) {
      this.metricReporter.increment("did_cache_miss_total");
      return null;
    }
    this.metricReporter.increment("did_cache_hit_total");
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
