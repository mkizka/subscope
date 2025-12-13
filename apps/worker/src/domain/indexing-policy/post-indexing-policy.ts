import { asDid } from "@atproto/did";
import type { IIndexTargetRepository, Post } from "@repo/common/domain";

export class PostIndexingPolicy {
  constructor(private readonly indexTargetRepository: IIndexTargetRepository) {}
  static inject = ["indexTargetRepository"] as const;

  async shouldIndex(post: Post): Promise<boolean> {
    if (post.isReply()) {
      const targetDids = post
        .getReplyTargetUris()
        .map((uri) => asDid(uri.hostname));

      return this.indexTargetRepository.hasTrackedActor([
        post.actorDid,
        ...targetDids,
      ]);
    }

    return this.indexTargetRepository.isTrackedActor(post.actorDid);
  }
}
