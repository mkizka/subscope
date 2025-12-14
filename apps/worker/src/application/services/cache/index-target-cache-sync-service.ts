import type { IIndexTargetCache } from "../../../domain/index-target/index-target-cache.js";
import type { IIndexTargetQuery } from "../../../domain/index-target/index-target-query.js";
import type { IIndexTargetRepository } from "../../interfaces/repositories/index-target-repository.js";

export class IndexTargetCacheSyncService {
  constructor(
    private readonly indexTargetRepository: IIndexTargetRepository,
    private readonly indexTargetQuery: IIndexTargetQuery,
    private readonly indexTargetCache: IIndexTargetCache,
  ) {}
  static inject = [
    "indexTargetDataRepository",
    "indexTargetQuery",
    "indexTargetCache",
  ] as const;

  async syncFollowCreate(followUri: string): Promise<void> {
    const followerDid =
      await this.indexTargetRepository.findFollowerDid(followUri);
    if (!followerDid) {
      return;
    }

    const isSubscriber = await this.indexTargetQuery.isSubscriber(followerDid);
    if (!isSubscriber) {
      return;
    }

    const followeeDid =
      await this.indexTargetRepository.findFolloweeDid(followUri);
    if (!followeeDid) {
      return;
    }

    await this.indexTargetCache.addTrackedActor(followeeDid);
  }
}
