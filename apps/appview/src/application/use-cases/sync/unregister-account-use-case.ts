import type { Did } from "@atproto/did";
import type { IJobScheduler } from "@repo/common/domain";

import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import type { IFollowQuery } from "../../interfaces/queries/follow-query.js";

export class NotRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotRegistered";
  }
}

type UnregisterAccountParams = {
  actorDid: Did;
};

export class UnregisterAccountUseCase {
  constructor(
    private readonly registrationRepository: IRegistrationRepository,
    private readonly followQuery: IFollowQuery,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute(params: UnregisterAccountParams): Promise<void> {
    const existingRegistration = await this.registrationRepository.find(
      params.actorDid,
    );
    if (!existingRegistration) {
      throw new NotRegisteredError("Not registered with this server");
    }

    await this.registrationRepository.delete(params.actorDid);

    const followeeDids = await this.followQuery.findFolloweeDids(
      params.actorDid,
    );
    for (const did of [params.actorDid, ...followeeDids]) {
      await this.jobScheduler.scheduleSyncTapRepo(did);
    }
  }
}
