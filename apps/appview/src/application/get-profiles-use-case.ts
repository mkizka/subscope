import type { Did } from "@atproto/did";
import { type Handle } from "@repo/common/utils";

import type { ProfileViewService } from "./service/profile-view-service.js";

export class GetProfilesUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(handleOrDids: (Handle | Did)[]) {
    return await this.profileViewService.findProfileViewDetailed(handleOrDids);
  }
}
