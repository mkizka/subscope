import type { Did } from "@atproto/did";
import {
  type AfterCommitContext,
  type IJobScheduler,
} from "@repo/common/interface";

import { Registration } from "../../../domain/models/registration.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";
import type { IRegistrationRepository } from "../../interfaces/registration-repository.js";

export class CreateRegistrationService {
  constructor(
    private readonly deps: {
      registrationRepository: IRegistrationRepository;
      followQuery: IFollowQuery;
      jobScheduler: IJobScheduler;
    },
  ) {}

  async create({
    ctx,
    accountDid,
    inviteCode,
  }: {
    ctx: AfterCommitContext;
    accountDid: Did;
    inviteCode?: string;
  }): Promise<void> {
    const registration = new Registration({
      accountDid,
      inviteCode,
      createdAt: new Date(),
    });
    await this.deps.registrationRepository.save({ ctx, registration });

    ctx.afterCommit(async () => {
      const followeeDids =
        await this.deps.followQuery.findFolloweeDids(accountDid);
      for (const did of [accountDid, ...followeeDids]) {
        await this.deps.jobScheduler.scheduleSyncAccountKind(did);
      }
    });
  }
}
