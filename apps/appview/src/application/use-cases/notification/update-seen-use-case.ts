import type { Did } from "@atproto/did";
import { type ITransactionManager, Registration } from "@repo/common/domain";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";

export class UpdateSeenUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: { actorDid: Did; seenAt: Date }): Promise<void> {
    const registration = await this.registrationRepository.find(
      params.actorDid,
    );
    if (!registration) {
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      await this.registrationRepository.save({
        ctx,
        registration: new Registration({
          actorDid: registration.actorDid,
          inviteCode: registration.inviteCode,
          seenAt: params.seenAt,
          createdAt: registration.createdAt,
        }),
      });
    });
  }
}
