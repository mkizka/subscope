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
    private readonly registrationRepository: IRegistrationRepository,
    private readonly followQuery: IFollowQuery,
    private readonly jobScheduler: IJobScheduler,
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
    await this.registrationRepository.save({ ctx, registration });

    ctx.afterCommit(async () => {
      const followeeDids = await this.followQuery.findFolloweeDids(accountDid);
      await this.jobScheduler.scheduleSyncTapRepo(accountDid, {
        refetch: true,
      });
      for (const did of followeeDids) {
        await this.jobScheduler.scheduleSyncTapRepo(did);
      }
    });
  }
}
