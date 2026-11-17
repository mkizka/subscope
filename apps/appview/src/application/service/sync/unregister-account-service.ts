import type { Did } from "@atproto/did";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";

export class NotRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotRegistered";
  }
}

export class UnregisterAccountService {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly followQuery: IFollowQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async unregister({
    ctx,
    accountDid,
  }: {
    ctx: AfterCommitContext;
    accountDid: Did;
  }): Promise<void> {
    const existingRegistration =
      await this.registrationRepository.find(accountDid);
    if (!existingRegistration) {
      throw new NotRegisteredError("Not registered with this server");
    }

    await this.registrationRepository.delete({ ctx, accountDid });

    const followeeDids = await this.followQuery.findFolloweeDids(accountDid);
    ctx.afterCommit(async () => {
      for (const did of [accountDid, ...followeeDids]) {
        await this.jobScheduler.scheduleSyncTapRepo(did);
      }
    });
  }
}
