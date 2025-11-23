import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import type { RedisClient } from "@repo/common/infrastructure";
import { schema } from "@repo/db";

import type { ISubscriberRepository } from "../../application/interfaces/repositories/subscriber-repository.js";

const NAMESPACE = "indexing-cache";
const SUBSCRIBERS_KEY = "subscribers";

export class SubscriberRepository implements ISubscriberRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["redis", "db"] as const;

  private getKey(): string {
    return `${NAMESPACE}:${SUBSCRIBERS_KEY}`;
  }

  async updateCache(): Promise<void> {
    const subscribers = await this.db
      .select({ actorDid: schema.subscriptions.actorDid })
      .from(schema.subscriptions);

    const subscriberDids = subscribers.map((s) => s.actorDid);

    const key = this.getKey();
    const tempKey = `${key}:temp`;

    const multi = this.redis.multi();

    multi.del(tempKey);
    if (subscriberDids.length > 0) {
      multi.sAdd(tempKey, subscriberDids);
      multi.rename(tempKey, key);
    } else {
      multi.del(key);
    }

    await multi.exec();
  }

  async isSubscriber(actorDid: Did): Promise<boolean> {
    const key = this.getKey();
    const result = await this.redis.sIsMember(key, actorDid);
    return Boolean(result);
  }

  async hasSubscriber(actorDids: Did[]): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const key = this.getKey();
    const results = await this.redis.smIsMember(key, actorDids);
    return results.some((result) => result);
  }
}
