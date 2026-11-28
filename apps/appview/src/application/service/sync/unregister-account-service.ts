import type { Did } from "@atproto/did";
import type { AfterCommitContext, IJobScheduler } from "@repo/common/interface";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";

export class NotMemberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotMember";
  }
}

export class UnregisterAccountService {
  constructor(
    private readonly deps: {
      registrationRepository: IRegistrationRepository;
      followQuery: IFollowQuery;
      jobScheduler: IJobScheduler;
    },
  ) {}

  async unregister({
    ctx,
    accountDid,
  }: {
    ctx: AfterCommitContext;
    accountDid: Did;
  }): Promise<void> {
    const existingRegistration =
      await this.deps.registrationRepository.find(accountDid);
    if (!existingRegistration) {
      throw new NotMemberError("Not a member of this server");
    }

    await this.deps.registrationRepository.delete({ ctx, accountDid });

    const followeeDids =
      await this.deps.followQuery.findFolloweeDids(accountDid);
    ctx.afterCommit(async () => {
      for (const did of [accountDid, ...followeeDids]) {
        await this.deps.jobScheduler.scheduleSyncAccountKind(did, {
          fromFollow: false,
        });
      }
    });
  }
}
