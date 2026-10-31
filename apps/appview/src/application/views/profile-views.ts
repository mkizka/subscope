import type { Did } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";
import type { ProfileDetailed } from "@repo/common/domain";

import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import type { ViewContext } from "./view-context.js";

export class ProfileViews {
  constructor(private readonly assetUrlBuilder: IAssetUrlBuilder) {}

  async basic(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewBasic | undefined> {
    const profile = await ctx.profile(did);
    return profile && this.toBasic(profile, await ctx.viewerState(did));
  }

  async view(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileView | undefined> {
    const profile = await ctx.profile(did);
    if (!profile) {
      return undefined;
    }
    return {
      ...this.toBasic(profile, await ctx.viewerState(did)),
      $type: "app.bsky.actor.defs#profileView",
      description: profile.description ?? undefined,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  private toBasic(
    profile: ProfileDetailed,
    viewerState: Awaited<ReturnType<ViewContext["viewerState"]>>,
  ): AppBskyActorDefs.ProfileViewBasic {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: profile.avatarCid
        ? this.assetUrlBuilder.getAvatarThumbnailUrl(
            profile.actorDid,
            profile.avatarCid,
          )
        : undefined,
      viewer: {
        $type: "app.bsky.actor.defs#viewerState",
        following: viewerState.following,
        followedBy: viewerState.followedBy,
      },
      createdAt: profile.createdAt
        ? toDatetimeString(profile.createdAt)
        : undefined,
    };
  }
}
