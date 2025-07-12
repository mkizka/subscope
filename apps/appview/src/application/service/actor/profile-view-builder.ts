import { type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";

import { env } from "../../../shared/env.js";

export class ProfileViewBuilder {
  static inject = [] as const;

  profileViewBasic(
    profile: ProfileDetailed,
  ): $Typed<AppBskyActorDefs.ProfileViewBasic> {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      createdAt: profile.createdAt?.toISOString(),
    };
  }

  profileViewDetailed(
    profile: ProfileDetailed,
    options?: {
      viewerState?: $Typed<AppBskyActorDefs.ViewerState>;
      stats?: {
        followsCount: number;
        followersCount: number;
        postsCount: number;
      };
    },
  ): $Typed<AppBskyActorDefs.ProfileViewDetailed> {
    return {
      ...this.profileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      followersCount: options?.stats?.followersCount,
      followsCount: options?.stats?.followsCount,
      postsCount: options?.stats?.postsCount,
      indexedAt: profile.indexedAt?.toISOString(),
      viewer: options?.viewerState,
    };
  }

  profileView(profile: ProfileDetailed): $Typed<AppBskyActorDefs.ProfileView> {
    return {
      ...this.profileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileView" as const,
      description: profile.description ?? undefined,
      indexedAt: profile.indexedAt?.toISOString(),
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
    if (!profile.avatar) {
      return undefined;
    }
    return `${env.BLOB_PROXY_URL}/images/avatar_thumbnail/${profile.actorDid}/${profile.avatar.cid}.jpg`;
  }
}
