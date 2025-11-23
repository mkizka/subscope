import { asDid } from "@atproto/did";
import type { Like, TransactionContext } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../application/interfaces/repositories/tracked-actor-repository.js";

export class LikeIndexingPolicy {
  constructor(
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = ["trackedActorRepository"] as const;

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    return this.trackedActorRepository.hasTrackedActor(ctx, [
      like.actorDid,
      asDid(like.subjectUri.hostname),
    ]);
  }
}
