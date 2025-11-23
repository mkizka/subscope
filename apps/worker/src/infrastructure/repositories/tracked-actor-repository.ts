import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import type { RedisClient } from "@repo/common/infrastructure";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { ITrackedActorRepository } from "../../application/interfaces/repositories/tracked-actor-repository.js";

const NAMESPACE = "indexing-cache";
const TRACKED_ACTORS_KEY = "tracked_actors";

export class TrackedActorRepository implements ITrackedActorRepository {
  constructor(
    private readonly redis: RedisClient,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["redis", "db"] as const;

  private getKey(): string {
    return `${NAMESPACE}:${TRACKED_ACTORS_KEY}`;
  }

  async updateCache(): Promise<void> {
    const subscribers = await this.db
      .select({ actorDid: schema.subscriptions.actorDid })
      .from(schema.subscriptions);

    const followees = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .innerJoin(
        schema.subscriptions,
        eq(schema.follows.actorDid, schema.subscriptions.actorDid),
      );

    const subscriberDids = subscribers.map((s) => s.actorDid);
    const followeeDids = followees.map((f) => f.subjectDid);
    const trackedActorDids = [...new Set([...subscriberDids, ...followeeDids])];

    const key = this.getKey();
    const tempKey = `${key}:temp`;

    const multi = this.redis.multi();

    multi.del(tempKey);
    if (trackedActorDids.length > 0) {
      multi.sAdd(tempKey, trackedActorDids);
      multi.rename(tempKey, key);
    } else {
      multi.del(key);
    }

    await multi.exec();
  }

  async isTrackedActor(actorDid: Did): Promise<boolean> {
    const key = this.getKey();
    const result = await this.redis.sIsMember(key, actorDid);
    return Boolean(result);
  }

  async hasTrackedActor(actorDids: Did[]): Promise<boolean> {
    if (actorDids.length === 0) {
      return false;
    }

    const key = this.getKey();
    const results = await this.redis.smIsMember(key, actorDids);
    return results.some((result) => result);
  }
}
