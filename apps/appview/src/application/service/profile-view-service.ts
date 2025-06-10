import type { Did } from "@atproto/did";
import type { AppBskyActorDefs } from "@repo/client/server";
import type { ProfileDetailed } from "@repo/common/domain";
import { type Handle, isHandle } from "@repo/common/utils";

import { env } from "../../shared/env.js";
import type { IHandlesToDidsRepository } from "../interfaces/handles-to-dids-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";

type HandleOrDid = Handle | Did;

export class ProfileViewService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly handlesToDidsRepository: IHandlesToDidsRepository,
  ) {}
  static inject = ["profileRepository", "handlesToDidsRepository"] as const;

  private async findProfile(handleOrDids: HandleOrDid[]) {
    const handles = handleOrDids.filter((handleOrDid) => isHandle(handleOrDid));
    const didsByHandle =
      await this.handlesToDidsRepository.findDidsByHandle(handles);
    const dids = handleOrDids
      .map((handleOrDid) =>
        isHandle(handleOrDid) ? didsByHandle[handleOrDid] : handleOrDid,
      )
      .filter((did) => !!did);
    return await this.profileRepository.findManyDetailed(dids);
  }

  private createProfileViewBasic(
    profile: ProfileDetailed,
  ): AppBskyActorDefs.ProfileViewBasic {
    return {
      $type: "app.bsky.actor.defs#profileViewBasic",
      did: profile.actorDid,
      handle: profile.handle?.toString() ?? "handle.invalid",
      displayName: profile.displayName ?? undefined,
      avatar: this.getAvatarThumbnailUrl(profile),
      // associated?: ProfileAssociated
      // viewer?: ViewerState
      // labels?: ComAtprotoLabelDefs.Label[]
      createdAt: profile.createdAt?.toISOString(),
    };
  }

  private createProfileViewDetailed(
    profile: ProfileDetailed,
  ): AppBskyActorDefs.ProfileViewDetailed {
    return {
      ...this.createProfileViewBasic(profile),
      $type: "app.bsky.actor.defs#profileViewDetailed",
      // description?: string
      // banner?: string
      // followersCount?: number
      // followsCount?: number
      // postsCount?: number
      // joinedViaStarterPack?: AppBskyGraphDefs.StarterPackViewBasic
      indexedAt: profile.indexedAt?.toISOString(),
      // pinnedPost?: ComAtprotoRepoStrongRef.Main
    };
  }

  async findProfileViewBasic(handleOrDids: HandleOrDid[]) {
    const profiles = await this.findProfile(handleOrDids);
    return profiles.map((profile) => this.createProfileViewBasic(profile));
  }

  async findProfileViewDetailed(handleOrDids: HandleOrDid[]) {
    const profiles = await this.findProfile(handleOrDids);
    return profiles.map((profile) => this.createProfileViewDetailed(profile));
  }

  private getAvatarThumbnailUrl(profile: ProfileDetailed) {
    if (!profile.avatar) {
      return undefined;
    }
    return `${env.BLOB_PROXY_URL}/images/avatar_thumbnail/${profile.actorDid}/${profile.avatar.cid}.jpg`;
  }
}
