import type { Did } from "@atproto/did";
import type { IJobScheduler } from "@repo/common/interface";

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

  async execute(accountDid: Did): Promise<void> {
    const existingRegistration =
      await this.registrationRepository.find(accountDid);
    if (!existingRegistration) {
      throw new NotRegisteredError("Not registered with this server");
    }

    await this.registrationRepository.delete(accountDid);

    const followeeDids = await this.followQuery.findFolloweeDids(accountDid);
    for (const did of [accountDid, ...followeeDids]) {
      await this.jobScheduler.scheduleSyncTapRepo(did);
    }
  }
}
