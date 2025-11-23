import { asDid } from "@atproto/did";
import type { Post, TransactionContext } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../application/interfaces/repositories/tracked-actor-repository.js";

export class PostIndexingPolicy {
  constructor(
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = ["trackedActorRepository"] as const;

  async shouldIndex(ctx: TransactionContext, post: Post): Promise<boolean> {
    if (post.isReply()) {
      const targetDids = post
        .getReplyTargetUris()
        .map((uri) => asDid(uri.hostname));

      return this.trackedActorRepository.hasTrackedActor(ctx, [
        post.actorDid,
        ...targetDids,
      ]);
    }

    return this.trackedActorRepository.isTrackedActor(ctx, post.actorDid);
  }
}
