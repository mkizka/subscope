import type { Did } from "@atproto/did";

import type { UnregisterAccountService } from "../../service/sync/unregister-account-service.js";

type UnregisterAccountParams = {
  accountDid: Did;
};

export class UnregisterAccountUseCase {
  constructor(
    private readonly unregisterAccountService: UnregisterAccountService,
  ) {}

  async execute(params: UnregisterAccountParams): Promise<void> {
    await this.unregisterAccountService.unregister(params.accountDid);
  }
}
