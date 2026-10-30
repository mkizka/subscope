import type { Did } from "@atproto/did";

import {
  type ILabelRepository,
  isTakendown,
} from "../../../application/interfaces/label-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";

export class AccountTakedownError extends Error {
  constructor() {
    super("Account has been suspended");
    this.name = "AccountTakedown";
  }
}

export class GetProfileUseCase {
  constructor(
    private readonly profileViewService: ProfileViewService,
    private readonly labelRepository: ILabelRepository,
  ) {}

  async execute(did: Did, viewerDid?: Did | null) {
    if (isTakendown(await this.labelRepository.findBySubjects([did]))) {
      throw new AccountTakedownError();
    }
    const [profile] = await this.profileViewService.findProfileViewDetailed(
      [did],
      viewerDid,
    );
    return profile;
  }
}
