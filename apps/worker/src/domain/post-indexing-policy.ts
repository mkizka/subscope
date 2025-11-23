import { asDid } from "@atproto/did";
import type { Post, TransactionContext } from "@repo/common/domain";

import type { ITrackedActorChecker } from "../application/interfaces/repositories/tracked-actor-checker.js";

export class PostIndexingPolicy {
  constructor(private readonly trackedActorChecker: ITrackedActorChecker) {}
  static inject = ["trackedActorChecker"] as const;

  async shouldIndex(ctx: TransactionContext, post: Post): Promise<boolean> {
    if (post.isReply()) {
      const targetDids = post
        .getReplyTargetUris()
        .map((uri) => asDid(uri.hostname));

      return this.trackedActorChecker.hasTrackedActor(ctx, [
        post.actorDid,
        ...targetDids,
      ]);
    }

    return this.trackedActorChecker.isTrackedActor(ctx, post.actorDid);
  }
}
