import type { Did } from "@atproto/did";

import type { RegisterAccountService } from "../../service/sync/register-account-service.js";

export class RegisterAccountUseCase {
  constructor(
    private readonly registerAccountService: RegisterAccountService,
  ) {}

  async execute(params: { accountDid: Did; code?: string }): Promise<void> {
    await this.registerAccountService.execute({
      ...params,
      inviteCodeRequired: true,
    });
  }
}
