import type { Did } from "@atproto/did";
import type { IJobScheduler } from "@repo/common/domain";

import type { IFollowRepository } from "../../../application/interfaces/follow-repository.js";
import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";

export class NotSubscribedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotSubscribed";
  }
}

type UnsubscribeServerParams = {
  actorDid: Did;
};

export class UnsubscribeServerUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly followRepository: IFollowRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute(params: UnsubscribeServerParams): Promise<void> {
    const existingSubscription = await this.subscriptionRepository.find(
      params.actorDid,
    );
    if (!existingSubscription) {
      throw new NotSubscribedError("Not subscribed to this server");
    }

    await this.subscriptionRepository.delete(params.actorDid);

    const followeeDids = await this.followRepository.findFolloweeDids(
      params.actorDid,
    );
    for (const did of [params.actorDid, ...followeeDids]) {
      await this.jobScheduler.scheduleSyncTapRepo(did);
    }
  }
}
