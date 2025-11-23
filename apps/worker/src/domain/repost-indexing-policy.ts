import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../application/interfaces/repositories/tracked-actor-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = ["trackedActorRepository"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    return this.trackedActorRepository.hasTrackedActor(ctx, [
      repost.actorDid,
      asDid(repost.subjectUri.hostname),
    ]);
  }
}
