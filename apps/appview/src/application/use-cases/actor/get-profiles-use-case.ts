import type { Did } from "@atproto/did";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";

import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetProfilesUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<AppBskyActorDefs.ProfileViewDetailed[]> {
    const ctx = this.viewContextFactory.create({ viewerDid });
    const profiles = await Promise.all(
      dids.map((did) => this.profileViews.detailed(did, ctx)),
    );
    return profiles.filter((profile) => profile !== undefined);
  }
}
