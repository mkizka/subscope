import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  type AfterCommitContext,
  type IJobScheduler,
} from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import { Account } from "../../../domain/models/account.js";

export class CreateAdminService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute({
    ctx,
    did,
  }: {
    ctx: AfterCommitContext;
    did: Did;
  }): Promise<void> {
    const existingAccount = await this.accountRepository.find(did);
    const account = existingAccount ?? Account.create({ did });
    account.promoteToAdmin();
    await this.accountRepository.save({ ctx, account });

    if (!account.handle) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleResolveDid(did, { live: true }),
      );
    }

    const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
    ctx.afterCommit(() =>
      this.jobScheduler.scheduleFetchRecord(profileUri, {
        live: true,
        depth: 0,
      }),
    );
  }
}
