import { asDid } from "@atproto/did";
import type { IIndexTargetRepository, Like } from "@repo/common/domain";

export class LikeIndexingPolicy {
  constructor(private readonly indexTargetRepository: IIndexTargetRepository) {}
  static inject = ["indexTargetRepository"] as const;

  async shouldIndex(like: Like): Promise<boolean> {
    return this.indexTargetRepository.hasTrackedActor([
      like.actorDid,
      asDid(like.subjectUri.hostname),
    ]);
  }
}
