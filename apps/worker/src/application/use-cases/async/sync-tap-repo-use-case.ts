import type { Did } from "@atproto/did";
import type { DatabaseClient, ITapClient } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";

export class SyncTapRepoUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly followRepository: IFollowRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(did: Did) {
    const ctx = { db: this.db };
    const isTrackedActor =
      (await this.subscriptionRepository.isSubscriber(ctx, did)) ||
      (await this.followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: did,
      }));
    if (isTrackedActor) {
      await this.tapClient.addRepo(did);
    } else {
      await this.tapClient.removeRepo(did);
    }
  }
}
