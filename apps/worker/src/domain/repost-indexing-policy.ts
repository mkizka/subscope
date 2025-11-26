import { asDid } from "@atproto/did";
import type { IIndexTargetRepository, Repost } from "@repo/common/domain";

export class RepostIndexingPolicy {
  constructor(private readonly indexTargetRepository: IIndexTargetRepository) {}
  static inject = ["indexTargetRepository"] as const;

  async shouldIndex(repost: Repost): Promise<boolean> {
    return this.indexTargetRepository.hasTrackedActor([
      repost.actorDid,
      asDid(repost.subjectUri.hostname),
    ]);
  }
}
