import type { Did } from "@atproto/did";

import type { ProfileViewService } from "./service/view/profile-view-service.js";

export class GetProfilesUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(dids: Did[]) {
    return await this.profileViewService.findProfileViewDetailed(dids);
  }
}
