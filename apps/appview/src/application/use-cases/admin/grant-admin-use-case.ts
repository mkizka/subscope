import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";
import { NotSubscribedError } from "../../../application/use-cases/sync/unsubscribe-server-use-case.js";

export class GrantAdminUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const subscription = await this.subscriptionRepository.find(params.did);
    const actor = await this.actorRepository.find(params.did);
    if (!subscription || !actor) {
      throw new NotSubscribedError("Not subscribed to this server");
    }

    actor.promoteToAdmin();
    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
  }
}
