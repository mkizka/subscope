import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { UnregisterAccountUseCase } from "../sync/unregister-account-use-case.js";
import { NotRegisteredError } from "../sync/unregister-account-use-case.js";

export class CannotBanAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotBanAdmin";
  }
}

export class BanAccountUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly unregisterAccountUseCase: UnregisterAccountUseCase,
  ) {}
  static inject = [
    "transactionManager",
    "actorRepository",
    "unregisterAccountUseCase",
  ] as const;

  async execute(params: { did: Did }): Promise<void> {
    const actor = await this.actorRepository.find(params.did);
    if (!actor) {
      throw new NotRegisteredError("Not registered with this server");
    }
    if (actor.isAdmin) {
      throw new CannotBanAdminError("Cannot ban an admin");
    }

    await this.unregisterAccountUseCase.execute({ actorDid: params.did });
    actor.ban();
    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
  }
}
