import type { Did } from "@atproto/did";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";

type VerifyAccessParams = {
  requesterDid: Did;
};

export class VerifyAccessUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(
    params: VerifyAccessParams,
  ): Promise<{ status: "authorized" | "unauthorized" }> {
    const account = await this.accountRepository.find(params.requesterDid);
    if (account?.isAdmin) {
      return { status: "authorized" };
    }

    return { status: "unauthorized" };
  }
}
