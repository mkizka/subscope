import { type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";

import type { AssetUrlBuilder } from "../../../infrastructure/asset-url-builder/asset-url-builder.js";

export class ProfileViewBuilder {
  constructor(private readonly assetUrlBuilder: AssetUrlBuilder) {}
  static inject = ["assetUrlBuilder"] as const;

  profileViewBasic(
    profile: ProfileDetailed,
    viewerState: $Typed<AppBskyActorDefs.ViewerState>,
  ): $Typed<AppBskyActorDefs.ProfileViewBasic> {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      viewer: viewerState,
      createdAt: profile.createdAt?.toISOString(),
    };
  }

  profileView(
    profile: ProfileDetailed,
    viewerState: $Typed<AppBskyActorDefs.ViewerState>,
  ): $Typed<AppBskyActorDefs.ProfileView> {
    return {
      ...this.profileViewBasic(profile, viewerState),
      $type: "app.bsky.actor.defs#profileView" as const,
      description: profile.description ?? undefined,
      indexedAt: profile.indexedAt.toISOString(),
    };
  }

  profileViewDetailed(
    profile: ProfileDetailed,
    viewerState: $Typed<AppBskyActorDefs.ViewerState>,
    stats?: {
      followsCount: number;
      followersCount: number;
      postsCount: number;
    },
  ): $Typed<AppBskyActorDefs.ProfileViewDetailed> {
    return {
      ...this.profileViewBasic(profile, viewerState),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      banner: this.getBannerUrl(profile),
      description: profile.description ?? undefined,
      followersCount: stats?.followersCount,
      followsCount: stats?.followsCount,
      postsCount: stats?.postsCount,
      indexedAt: profile.indexedAt.toISOString(),
    };
  }

  emptyViewerState(): $Typed<AppBskyActorDefs.ViewerState> {
    return {
      $type: "app.bsky.actor.defs#viewerState",
    };
  }

  viewerState(
    actorDid: Did,
    followingMap: Map<Did, AtUri>,
    followedByMap: Map<Did, AtUri>,
  ): $Typed<AppBskyActorDefs.ViewerState> {
    const following = followingMap.get(actorDid)?.toString();
    const followedBy = followedByMap.get(actorDid)?.toString();

    return {
      $type: "app.bsky.actor.defs#viewerState",
      following,
      followedBy,
    };
  }

  private getAvatarThumbnailUrl(profile: ProfileDetailed) {
    if (!profile.avatarCid) {
      return undefined;
    }
    return this.assetUrlBuilder.getAvatarThumbnailUrl(
      profile.actorDid,
      profile.avatarCid,
    );
  }

  private getBannerUrl(profile: ProfileDetailed) {
    if (!profile.bannerCid) {
      return undefined;
    }
    return this.assetUrlBuilder.getBannerUrl(
      profile.actorDid,
      profile.bannerCid,
    );
  }
}
