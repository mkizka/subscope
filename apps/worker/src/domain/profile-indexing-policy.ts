import type { TransactionContext } from "@repo/common/domain";
import type { Profile } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../application/interfaces/repositories/tracked-actor-repository.js";

export class ProfileIndexingPolicy {
  constructor(
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = ["trackedActorRepository"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    profile: Profile,
  ): Promise<boolean> {
    return this.trackedActorRepository.isTrackedActor(ctx, profile.actorDid);
  }
}
