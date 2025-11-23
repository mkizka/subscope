import type { TransactionContext } from "@repo/common/domain";
import type { Profile } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../application/interfaces/repositories/tracked-actor-checker.js";

export class ProfileIndexingPolicy {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    profile: Profile,
  ): Promise<boolean> {
    return this.trackedActorChecker.isTrackedActor(ctx, profile.actorDid);
  }
}
