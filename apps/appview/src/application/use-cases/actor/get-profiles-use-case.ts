import type { Did } from "@atproto/did";

import type { ProfileViewService } from "../../service/actor/profile-view-service.js";

export class GetProfilesUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(dids: Did[], viewerDid?: Did | null) {
    return await this.profileViewService.findProfileViewDetailed(
      dids,
      viewerDid,
    );
  }
}
