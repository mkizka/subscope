import type { Did } from "@atproto/did";

import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";

export class UpdateSeenUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async execute(params: { actorDid: Did; seenAt: Date }): Promise<void> {
    await this.subscriptionRepository.updateSeenAt(
      params.actorDid,
      params.seenAt,
    );
  }
}
