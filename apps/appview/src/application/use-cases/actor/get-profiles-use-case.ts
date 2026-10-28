import type { Did } from "@atproto/did";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";

import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";

export class GetProfilesUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<AppBskyActorDefs.ProfileViewDetailed[]> {
    return await this.profileViewService.findProfileViewDetailed(
      dids,
      viewerDid,
    );
  }
}
