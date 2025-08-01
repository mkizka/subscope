import type { CacheResult, DidCache, DidDocument } from "@atproto/identity";
import KeyvRedis from "@keyv/redis";
import type { IMetricReporter } from "@repo/common/domain";
import Keyv from "keyv";

type CacheVal = {
  doc: DidDocument;
  updatedAt: number;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export class RedisDidCache implements DidCache {
  private readonly cache: Keyv<CacheVal>;
  private readonly maxTTL = DAY;
  private readonly staleTTL = HOUR;

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
    await this.cache.set(did, { doc, updatedAt: Date.now() }, this.maxTTL);
  }

  async checkCache(did: string): Promise<CacheResult | null> {
    const val = await this.cache.get(did);
    if (!val) {
      this.metricReporter.increment("resolve_did_cache_miss_total");
      return null;
    }
    this.metricReporter.increment("resolve_did_cache_hit_total");

    const stale = Date.now() > val.updatedAt + this.staleTTL;

    return {
      ...val,
      did,
      stale,
      // TTLが切れたらRedisが自動的に削除するため使わない
      expired: false,
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
