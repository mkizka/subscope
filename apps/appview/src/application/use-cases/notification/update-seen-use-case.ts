import type { Did } from "@atproto/did";
import { type ITransactionManager } from "@repo/common/interface";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import { Registration } from "../../../domain/models/registration.js";

export class UpdateSeenUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: { accountDid: Did; seenAt: Date }): Promise<void> {
    const registration = await this.registrationRepository.find(
      params.accountDid,
    );
    if (!registration) {
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      await this.registrationRepository.save({
        ctx,
        registration: new Registration({
          accountDid: registration.accountDid,
          inviteCode: registration.inviteCode,
          seenAt: params.seenAt,
          createdAt: registration.createdAt,
        }),
      });
    });
  }
}
