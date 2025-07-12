import { type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import { env } from "../../../shared/env.js";
import type { IActorStatsRepository } from "../../interfaces/actor-stats-repository.js";
import type { IFollowRepository } from "../../interfaces/follow-repository.js";
import type { IProfileRepository } from "../../interfaces/profile-repository.js";
import { createCursorPaginator, type Page } from "../../utils/pagination.js";

export class ProfileViewService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly followRepository: IFollowRepository,
  ) {}
  static inject = [
    "profileRepository",
    "actorStatsRepository",
    "followRepository",
  ] as const;

  private async findProfile(dids: Did[]) {
    return await this.profileRepository.findManyDetailed(dids);
  }

  private createProfileViewBasic(
    profile: ProfileDetailed,
  ): $Typed<AppBskyActorDefs.ProfileViewBasic> {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle?.toString() ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      createdAt: profile.createdAt?.toISOString(),
    };
  }

  private createProfileViewDetailed(
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
      ...this.createProfileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      followersCount: options?.stats?.followersCount,
      followsCount: options?.stats?.followsCount,
      postsCount: options?.stats?.postsCount,
      indexedAt: profile.indexedAt?.toISOString(),
      viewer: options?.viewerState,
    };
  }

  async findProfileViewBasic(dids: Did[]) {
    const profiles = await this.findProfile(dids);
    return profiles.map((profile) => this.createProfileViewBasic(profile));
  }

  async findProfileViewDetailed(dids: Did[], viewerDid?: Did | null) {
    const profiles = await this.findProfile(dids);
    const statsMap = await this.actorStatsRepository.findStats(dids);

    if (!viewerDid) {
      return profiles.map((profile) => {
        const stats = statsMap.get(profile.actorDid);
        return this.createProfileViewDetailed(profile, { stats });
      });
    }

    const targetDids = profiles.map((profile) => profile.actorDid);
    const [followingMap, followedByMap] = await Promise.all([
      this.followRepository.findFollowingMap({
        actorDid: viewerDid,
        targetDids,
      }),
      this.followRepository.findFollowedByMap({
        actorDid: viewerDid,
        targetDids,
      }),
    ]);

    return profiles.map((profile) => {
      const stats = statsMap.get(profile.actorDid);
      const viewerState = this.createViewerState(
        profile,
        followingMap,
        followedByMap,
      );
      const profileView = this.createProfileViewDetailed(profile, {
        stats,
        viewerState,
      });
      return { ...profileView, viewer: viewerState };
    });
  }

  private createProfileView(
    profile: ProfileDetailed,
  ): $Typed<AppBskyActorDefs.ProfileView> {
    return {
      ...this.createProfileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileView" as const,
      description: profile.description ?? undefined,
      indexedAt: profile.indexedAt?.toISOString(),
    };
  }

  async findProfileView(
    dids: Did[],
  ): Promise<$Typed<AppBskyActorDefs.ProfileView>[]> {
    const profiles = await this.findProfile(dids);
    return profiles.map((profile) => this.createProfileView(profile));
  }

  async searchActorsWithPagination({
    query,
    cursor,
    limit,
  }: {
    query: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<$Typed<AppBskyActorDefs.ProfileView>>> {
    const paginator = createCursorPaginator<ProfileDetailed>({
      limit,
      // TODO: sortAtに変える？
      getCursor: (item) => required(item.indexedAt?.toISOString()),
    });

    const profiles = await this.profileRepository.searchActors({
      query,
      limit: paginator.queryLimit,
      cursor,
    });

    const page = paginator.extractPage(profiles);

    return {
      items: page.items.map((profile) => this.createProfileView(profile)),
      cursor: page.cursor,
    };
  }

  async searchActorsTypeahead({
    query,
    limit,
  }: {
    query: string;
    limit: number;
  }): Promise<$Typed<AppBskyActorDefs.ProfileViewBasic>[]> {
    const profiles = await this.profileRepository.searchActors({
      query,
      limit,
    });

    return profiles.map((profile) => this.createProfileViewBasic(profile));
  }

  private createViewerState(
    profile: ProfileDetailed,
    followingMap: Map<Did, AtUri>,
    followedByMap: Map<Did, AtUri>,
  ): $Typed<AppBskyActorDefs.ViewerState> {
    const following = followingMap.get(profile.actorDid)?.toString();
    const followedBy = followedByMap.get(profile.actorDid)?.toString();

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
