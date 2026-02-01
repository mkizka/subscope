import type { Did } from "@atproto/did";

import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";

type GetSubscriptionStatusParams = {
  actorDid: Did;
};

export class GetSubscriptionStatusUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async execute(params: GetSubscriptionStatusParams) {
    const subscription = await this.subscriptionRepository.findFirst(
      params.actorDid,
    );

    if (!subscription) {
      return {
        $type: "me.subsco.sync.getSubscriptionStatus#notSubscribed",
        isSubscriber: false as const,
      };
    }

    return {
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true as const,
    };
  }
}
