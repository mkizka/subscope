import type { Did } from "@atproto/did";

import type { Account } from "../../../domain/models/account.js";
import type { IAccountRepository } from "../../interfaces/account-repository.js";
import type { IRegistrationRepository } from "../../interfaces/registration-repository.js";

export class AlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyRegistered";
  }
}

export class ValidateRegistrationService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async validate(accountDid: Did): Promise<Account | null> {
    const existingRegistration =
      await this.registrationRepository.find(accountDid);
    if (existingRegistration) {
      throw new AlreadyRegisteredError("Already registered with this server");
    }

    return await this.accountRepository.find(accountDid);
  }
}
