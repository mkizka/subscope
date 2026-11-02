import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { UnsubscribeServerUseCase } from "../sync/unsubscribe-server-use-case.js";
import { NotSubscribedError } from "../sync/unsubscribe-server-use-case.js";

export class CannotBanAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotBanAdmin";
  }
}

export class BanSubscriberUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly unsubscribeServerUseCase: UnsubscribeServerUseCase,
  ) {}
  static inject = [
    "transactionManager",
    "actorRepository",
    "unsubscribeServerUseCase",
  ] as const;

  async execute(params: { did: Did }): Promise<void> {
    const actor = await this.actorRepository.find(params.did);
    if (!actor) {
      throw new NotSubscribedError("Not subscribed to this server");
    }
    if (actor.isAdmin) {
      throw new CannotBanAdminError("Cannot ban an admin");
    }

    await this.unsubscribeServerUseCase.execute({ actorDid: params.did });
    actor.ban();
    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
  }
}
