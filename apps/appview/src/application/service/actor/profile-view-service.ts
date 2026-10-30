import { type Did } from "@atproto/did";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";

import type {
  ActorHydrationState,
  ActorHydrator,
} from "../../../application/hydration/actor-hydrator.js";
import type { ProfileViewBuilder } from "./profile-view-builder.js";

export class ProfileViewService {
  constructor(
    private readonly actorHydrator: ActorHydrator,
    private readonly profileViewBuilder: ProfileViewBuilder,
  ) {}

  async findProfileViewBasic(dids: Did[], viewerDid?: Did | null) {
    const state = await this.actorHydrator.hydrateProfiles(dids, { viewerDid });
    return [...state.profiles.values()].map((profile) =>
      this.profileViewBuilder.profileViewBasic(
        profile,
        this.viewerState(profile.actorDid, state, viewerDid),
      ),
    );
  }

  async findProfileView(
    dids: Did[],
    viewerDid?: Did | null,
    { includeTakedowns = false } = {},
  ): Promise<AppBskyActorDefs.ProfileView[]> {
    const state = await this.actorHydrator.hydrateProfiles(dids, {
      viewerDid,
      includeTakedowns,
    });
    return [...state.profiles.values()].map((profile) =>
      this.profileViewBuilder.profileView(
        profile,
        this.viewerState(profile.actorDid, state, viewerDid),
      ),
    );
  }

  async findProfileViewDetailed(
    dids: Did[],
    viewerDid?: Did | null,
  ): Promise<AppBskyActorDefs.ProfileViewDetailed[]> {
    const state = await this.actorHydrator.hydrateProfilesDetailed(dids, {
      viewerDid,
    });
    return [...state.profiles.values()].map((profile) =>
      this.profileViewBuilder.profileViewDetailed(
        profile,
        this.viewerState(profile.actorDid, state, viewerDid),
        state.stats.get(profile.actorDid),
      ),
    );
  }

  private viewerState(
    did: Did,
    state: ActorHydrationState,
    viewerDid?: Did | null,
  ) {
    if (!viewerDid) {
      return this.profileViewBuilder.emptyViewerState();
    }
    return this.profileViewBuilder.viewerState(
      did,
      state.following,
      state.followedBy,
    );
  }
}
