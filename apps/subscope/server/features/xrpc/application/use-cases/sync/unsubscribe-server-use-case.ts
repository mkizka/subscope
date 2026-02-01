import type { Did } from "@atproto/did";

import type { ISubscriptionRepository } from "@/server/features/xrpc/application/interfaces/subscription-repository.js";

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
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async execute(params: UnsubscribeServerParams): Promise<void> {
    const existingSubscription = await this.subscriptionRepository.findFirst(
      params.actorDid,
    );
    if (!existingSubscription) {
      throw new NotSubscribedError("Not subscribed to this server");
    }

    await this.subscriptionRepository.delete(params.actorDid);
  }
}
