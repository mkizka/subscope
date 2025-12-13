import type { Did } from "@atproto/did";
import type { Redis } from "ioredis";

import type { IIndexTargetCache } from "../../domain/index-target/index-target-cache.ts";
import type { IIndexTargetQuery } from "../../domain/index-target/index-target-query.ts";

const SUBSCRIBERS_KEY = "subscope:subscribers";
const TRACKED_ACTORS_KEY = "subscope:tracked_actors";

export class IndexTargetCache implements IIndexTargetQuery, IIndexTargetCache {
  constructor(private readonly redis: Redis) {}
  static inject = ["redis"] as const;

  async isSubscriber(did: Did): Promise<boolean> {
    const result = await this.redis.sismember(SUBSCRIBERS_KEY, did);
    return result === 1;
  }

  async hasSubscriber(dids: Did[]): Promise<boolean> {
    if (dids.length === 0) {
      return false;
    }
    const results = await this.redis.smismember(SUBSCRIBERS_KEY, ...dids);
    return results.some((result: number) => result === 1);
  }

  async isTrackedActor(did: Did): Promise<boolean> {
    const result = await this.redis.sismember(TRACKED_ACTORS_KEY, did);
    return result === 1;
  }

  async hasTrackedActor(dids: Did[]): Promise<boolean> {
    if (dids.length === 0) {
      return false;
    }
    const results = await this.redis.smismember(TRACKED_ACTORS_KEY, ...dids);
    return results.some((result: number) => result === 1);
  }

  async addSubscriber(did: Did): Promise<void> {
    await this.redis.sadd(SUBSCRIBERS_KEY, did);
  }

  async removeSubscriber(did: Did): Promise<void> {
    await this.redis.srem(SUBSCRIBERS_KEY, did);
  }

  async addTrackedActor(did: Did): Promise<void> {
    await this.redis.sadd(TRACKED_ACTORS_KEY, did);
  }

  async removeTrackedActor(did: Did): Promise<void> {
    await this.redis.srem(TRACKED_ACTORS_KEY, did);
  }

  async bulkAddSubscribers(dids: Did[]): Promise<void> {
    if (dids.length === 0) {
      return;
    }
    await this.redis.sadd(SUBSCRIBERS_KEY, ...dids);
  }

  async bulkAddTrackedActors(dids: Did[]): Promise<void> {
    if (dids.length === 0) {
      return;
    }
    await this.redis.sadd(TRACKED_ACTORS_KEY, ...dids);
  }

  async clear(): Promise<void> {
    await this.redis.del(SUBSCRIBERS_KEY, TRACKED_ACTORS_KEY);
  }
}
