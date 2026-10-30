import Keyv from "keyv";
import { createKeyvRedis } from "../keyv-redis/keyv-redis.js";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
export class RedisDidCache {
  metricReporter;
  cache;
  maxTTL = DAY;
  staleTTL = HOUR;
  constructor(redisUrl, metricReporter) {
    this.metricReporter = metricReporter;
    this.cache = new Keyv({
      namespace: "did-cache",
      // https://github.com/jaredwray/keyv/issues/1255
      useKeyPrefix: false,
      store: createKeyvRedis(redisUrl),
    });
  }
  async cacheDid(did, doc) {
    await this.cache.set(did, { doc, updatedAt: Date.now() }, this.maxTTL);
  }
  async checkCache(did) {
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
  async refreshCache(did, getDoc) {
    const doc = await getDoc();
    if (doc) {
      await this.cacheDid(did, doc);
    }
  }
  async clearEntry(did) {
    await this.cache.delete(did);
  }
  async clear() {
    await this.cache.clear();
  }
}
