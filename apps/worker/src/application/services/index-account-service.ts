import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  type AfterCommitContext,
  type IJobScheduler,
  type TransactionContext,
} from "@repo/common/interface";
import type { Handle } from "@repo/common/utils";

import type { AccountStatus } from "../../domain/account.js";
import { Account } from "../../domain/account.js";
import type { IProfileQuery } from "../interfaces/queries/profile-query.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

export class IndexAccountService {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly profileQuery: IProfileQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async upsert({
    ctx,
    did,
    handle,
    status,
    live,
  }: {
    ctx: AfterCommitContext;
    did: Did;
    handle?: Handle;
    status?: AccountStatus;
    live: boolean;
  }): Promise<void> {
    const existingAccount = await this.accountRepository.find({ ctx, did });
    const account = existingAccount ?? Account.create({ did });
    const changed =
      !existingAccount ||
      (!!handle && handle !== account.handle) ||
      (!!status && status !== account.status);

    if (handle) {
      account.updateHandle(handle);
    }
    if (status) {
      account.updateStatus(status);
    }

    if (changed) {
      await this.accountRepository.save({ ctx, account });
    }

    if (!account.handle) {
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleResolveDid(did, { live }),
      );
    }

    const profileExists = await this.profileQuery.exists({
      ctx,
      accountDid: did,
    });
    if (!profileExists) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      ctx.afterCommit(() =>
        this.jobScheduler.scheduleFetchRecord(profileUri, {
          live,
          depth: 0,
        }),
      );
    }
  }

  async delete({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    await this.accountRepository.delete({ ctx, did });
  }
}
