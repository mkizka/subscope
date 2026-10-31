import { type Did } from "@atproto/did";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";

import type {
  ActorLoader,
  ViewData,
} from "../../../application/loader/actor-loader.js";
import { filterVisible } from "../../../application/visibility/visibility-filter.js";
import type { ProfileViewBuilder } from "./profile-view-builder.js";

export class ProfileViewService {
  constructor(
    private readonly actorLoader: ActorLoader,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}

  async findProfileViewBasic(dids: Did[], viewerDid?: Did | null) {
    const data = filterVisible(
      await this.actorLoader.loadProfiles(dids, viewerDid),
    );
    return [...data.profiles.values()].map((profile) =>
      this.profileViewBuilder.profileViewBasic(
        profile,
        this.viewerState(profile.actorDid, data, viewerDid),
      ),
    );
  }

  async findProfileView(
    dids: Did[],
    viewerDid?: Did | null,
    { includeTakedowns = false } = {},
  ): Promise<AppBskyActorDefs.ProfileView[]> {
    const data = filterVisible(
      await this.actorLoader.loadProfiles(dids, viewerDid),
      { includeTakedowns },
    );
    return [...data.profiles.values()].map((profile) =>
      this.profileViewBuilder.profileView(
        profile,
        this.viewerState(profile.actorDid, data, viewerDid),
      ),
    );
  }

  private viewerState(did: Did, data: ViewData, viewerDid?: Did | null) {
    if (!viewerDid) {
      return this.profileViewBuilder.emptyViewerState();
    }
    return this.profileViewBuilder.viewerState(
      did,
      data.following,
      data.followedBy,
    );
  }
}
