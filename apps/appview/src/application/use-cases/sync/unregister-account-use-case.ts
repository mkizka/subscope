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

type UnregisterAccountParams = {
  accountDid: Did;
};

export class UnregisterAccountUseCase {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly followQuery: IFollowQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute(params: UnregisterAccountParams): Promise<void> {
    const existingRegistration = await this.registrationRepository.find(
      params.accountDid,
    );
    if (!existingRegistration) {
      throw new NotRegisteredError("Not registered with this server");
    }

    await this.registrationRepository.delete(params.accountDid);

    const followeeDids = await this.followQuery.findFolloweeDids(
      params.accountDid,
    );
    for (const did of [params.accountDid, ...followeeDids]) {
      await this.jobScheduler.scheduleSyncTapRepo(did);
    }
  }
}
