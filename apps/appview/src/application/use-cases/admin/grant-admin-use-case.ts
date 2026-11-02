import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/actor-repository.js";
import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import { NotRegisteredError } from "../../../application/use-cases/sync/unregister-account-use-case.js";

export class GrantAdminUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorRepository: IActorRepository,
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const registration = await this.registrationRepository.find(params.did);
    const actor = await this.actorRepository.find(params.did);
    if (!registration || !actor) {
      throw new NotRegisteredError("Not registered with this server");
    }

    actor.promoteToAdmin();
    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
  }
}
