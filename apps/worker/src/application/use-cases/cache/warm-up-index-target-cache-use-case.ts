import type { IIndexTargetCache } from "../../../domain/index-target/index-target-cache.js";
import type { IIndexTargetRepository } from "../../interfaces/repositories/index-target-repository.js";

export class WarmUpIndexTargetCacheUseCase {
  constructor(
    private readonly indexTargetRepository: IIndexTargetRepository,
    private readonly indexTargetCache: IIndexTargetCache,
  ) {}
  static inject = ["indexTargetDataRepository", "indexTargetCache"] as const;

  async execute(): Promise<void> {
    await this.indexTargetCache.clear();

    const subscriberDids =
      await this.indexTargetRepository.findAllSubscriberDids();

    await this.indexTargetCache.bulkAddSubscribers(subscriberDids);
    await this.indexTargetCache.bulkAddTrackedActors(subscriberDids);

    for (const subscriberDid of subscriberDids) {
      const followeeDids =
        await this.indexTargetRepository.findFolloweeDids(subscriberDid);
      await this.indexTargetCache.bulkAddTrackedActors(followeeDids);
    }
  }
}
