import type { CacheResult, DidCache, DidDocument } from "@atproto/identity";
import KeyvRedis from "@keyv/redis";
import Keyv from "keyv";

import { env } from "../../shared/env.js";

type CacheVal = {
  doc: DidDocument;
  updatedAt: number;
};

const TTL = 24 * 60 * 60 * 1000;

export class RedisDidCache implements DidCache {
  private readonly cache: Keyv<CacheVal>;

  constructor() {
    this.cache = new Keyv({
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      store: new KeyvRedis<CacheVal>(env.REDIS_URL),
    });
  }

  async cacheDid(did: string, doc: DidDocument): Promise<void> {
    await this.cache.set(did, { doc, updatedAt: Date.now() }, TTL);
  }

  async checkCache(did: string): Promise<CacheResult | null> {
    const val = await this.cache.get(did);
    if (!val) return null;
    return {
      ...val,
      did,
      stale: true,
      expired: true,
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
