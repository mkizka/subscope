import type { Did } from "@atproto/did";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";

export class GetProfilesUseCase {
  constructor(private readonly profileViewService: ProfileViewService) {}
  static inject = ["profileViewService"] as const;

  async execute(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<$Typed<AppBskyActorDefs.ProfileViewDetailed>[]> {
    return await this.profileViewService.findProfileViewDetailed(
      dids,
      viewerDid,
    );
  }
}
