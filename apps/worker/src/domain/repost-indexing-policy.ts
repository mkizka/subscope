import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../application/interfaces/repositories/tracked-actor-checker.js";

export class RepostIndexingPolicy {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    return this.trackedActorChecker.hasTrackedActor(ctx, [
      repost.actorDid,
      asDid(repost.subjectUri.hostname),
    ]);
  }
}
