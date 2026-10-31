import type { Did } from "@atproto/did";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";

import type { ProfileDto } from "../dto/profile-dto.js";
import type { IAssetUrlBuilder } from "../interfaces/asset-url-builder.js";
import { toLabelViews } from "./label-views.js";
import type { ViewContext } from "./view-context.js";

export class ProfileViews {
  constructor(private readonly assetUrlBuilder: IAssetUrlBuilder) {}

  async basic(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewBasic | undefined> {
    const profile = await ctx.profile(did);
    return profile && (await this.toBasic(profile, ctx));
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
      ...(await this.toBasic(profile, ctx)),
      $type: "app.bsky.actor.defs#profileView",
      description: profile.description ?? undefined,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  async detailed(
    did: Did,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewDetailed | undefined> {
    const profile = await ctx.profile(did);
    if (!profile) {
      return undefined;
    }
    const [basic, stats] = await Promise.all([
      this.toBasic(profile, ctx),
      ctx.actorStats(did),
    ]);
    return {
      ...basic,
      $type: "app.bsky.actor.defs#profileViewDetailed",
      description: profile.description ?? undefined,
      banner: profile.bannerCid
        ? this.assetUrlBuilder.getBannerUrl(profile.actorDid, profile.bannerCid)
        : undefined,
      followersCount: stats?.followersCount ?? 0,
      followsCount: stats?.followsCount ?? 0,
      postsCount: stats?.postsCount ?? 0,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  private async toBasic(
    profile: ProfileDto,
    ctx: ViewContext,
  ): Promise<AppBskyActorDefs.ProfileViewBasic> {
    const [viewerState, labels] = await Promise.all([
      ctx.viewerState(profile.actorDid),
      ctx.labelsOf(profile.actorDid),
    ]);
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
      labels: toLabelViews(labels),
      createdAt: profile.createdAt
        ? toDatetimeString(profile.createdAt)
        : undefined,
    };
  }
}
