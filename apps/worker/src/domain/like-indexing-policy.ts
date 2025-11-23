import { asDid } from "@atproto/did";
import type { Like, TransactionContext } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../application/interfaces/repositories/tracked-actor-checker.js";

export class LikeIndexingPolicy {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    return this.trackedActorChecker.hasTrackedActor(ctx, [
      like.actorDid,
      asDid(like.subjectUri.hostname),
    ]);
  }
}
