import { type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyActorDefs from "@repo/client/lex/app/bsky/actor/defs";
import type { ProfileDetailed } from "@repo/common/domain";

import type { IAssetUrlBuilder } from "../../../application/interfaces/asset-url-builder.js";

export class ProfileViewBuilder {
  constructor(private readonly assetUrlBuilder: IAssetUrlBuilder) {}

  profileViewBasic(
    profile: ProfileDetailed,
    viewerState: AppBskyActorDefs.ViewerState,
  ): AppBskyActorDefs.ProfileViewBasic {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      viewer: viewerState,
      createdAt: profile.createdAt
        ? toDatetimeString(profile.createdAt)
        : undefined,
    };
  }

  profileView(
    profile: ProfileDetailed,
    viewerState: AppBskyActorDefs.ViewerState,
  ): AppBskyActorDefs.ProfileView {
    return {
      ...this.profileViewBasic(profile, viewerState),
      $type: "app.bsky.actor.defs#profileView",
      description: profile.description ?? undefined,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  profileViewDetailed(
    profile: ProfileDetailed,
    viewerState: AppBskyActorDefs.ViewerState,
    stats?: {
      followsCount: number;
      followersCount: number;
      postsCount: number;
    },
  ): AppBskyActorDefs.ProfileViewDetailed {
    return {
      ...this.profileViewBasic(profile, viewerState),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      banner: this.getBannerUrl(profile),
      description: profile.description ?? undefined,
      followersCount: stats?.followersCount ?? 0,
      followsCount: stats?.followsCount ?? 0,
      postsCount: stats?.postsCount ?? 0,
      indexedAt: toDatetimeString(profile.indexedAt),
    };
  }

  emptyViewerState(): AppBskyActorDefs.ViewerState {
    return {
      $type: "app.bsky.actor.defs#viewerState",
    };
  }

  viewerState(
    actorDid: Did,
    followingMap: Map<Did, AtUri>,
    followedByMap: Map<Did, AtUri>,
  ): AppBskyActorDefs.ViewerState {
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
