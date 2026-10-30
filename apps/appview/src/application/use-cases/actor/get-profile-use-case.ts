import type { Did } from "@atproto/did";

import type { ActorLoader } from "../../../application/loader/actor-loader.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import { hiddenReason } from "../../../application/visibility/visibility-filter.js";

const messages = {
  AccountTakedown: "Account has been suspended",
  AccountDeactivated: "Account is deactivated",
};

export class AccountHiddenError extends Error {
  constructor(reason: keyof typeof messages) {
    super(messages[reason]);
    this.name = reason;
  }
}

export class GetProfileUseCase {
  constructor(
    private readonly profileViewService: ProfileViewService,
    private readonly actorLoader: ActorLoader,
  ) {}

  async execute(did: Did, viewerDid?: Did | null) {
    const data = await this.actorLoader.loadProfiles([did]);
    const profile = data.profiles.get(did);
    const reason = profile && hiddenReason(profile, data.labels.get(did));
    if (reason) {
      throw new AccountHiddenError(reason);
    }
    const [view] = await this.profileViewService.findProfileViewDetailed(
      [did],
      viewerDid,
    );
    return view;
  }
}
