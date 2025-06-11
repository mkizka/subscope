import { type Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { ProfileDetailed } from "@repo/common/domain";

import type {
  IProfileRepository,
  SearchResult,
} from "../application/interfaces/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findManyDetailed(dids: Did[]) {
    const profiles = await this.db.query.profiles.findMany({
      where: (profiles, { inArray }) => inArray(profiles.actorDid, dids),
      with: {
        user: true,
        avatar: true,
      },
    });
    return profiles.map(
      (profile) =>
        new ProfileDetailed({
          uri: profile.uri,
          cid: profile.cid,
          actorDid: profile.actorDid,
          handle: profile.user.handle,
          avatar: profile.avatar && {
            cid: profile.avatar.cid,
            mimeType: profile.avatar.mimeType,
            size: profile.avatar.size,
          },
          description: profile.description,
          displayName: profile.displayName,
          createdAt: profile.createdAt,
          indexedAt: profile.indexedAt,
        }),
    );
  }

  async search(
    query: string,
    limit: number,
    cursor?: string,
  ): Promise<SearchResult> {
    const searchTerm = `%${query}%`;

    const profiles = await this.db.query.profiles.findMany({
      where: (profiles, { and, gt }) => {
        const conditions = [];
        if (cursor) {
          conditions.push(gt(profiles.indexedAt, new Date(cursor)));
        }
        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      with: {
        user: true,
        avatar: true,
      },
      orderBy: (profiles, { asc }) => asc(profiles.indexedAt),
    });

    // displayNameまたはhandleにマッチするprofileをフィルタリング
    const filteredProfiles = profiles.filter(
      (profile) =>
        (profile.displayName &&
          profile.displayName.toLowerCase().includes(query.toLowerCase())) ||
        (profile.user.handle &&
          profile.user.handle.toLowerCase().includes(query.toLowerCase())),
    );

    const hasMore = filteredProfiles.length > limit;
    const resultsToReturn = hasMore
      ? filteredProfiles.slice(0, limit)
      : filteredProfiles;
    const lastProfile =
      resultsToReturn.length > 0
        ? resultsToReturn[resultsToReturn.length - 1]
        : null;
    const nextCursor =
      hasMore && lastProfile?.indexedAt
        ? lastProfile.indexedAt.toISOString()
        : undefined;

    const profileDetails = resultsToReturn.map(
      (profile) =>
        new ProfileDetailed({
          uri: profile.uri,
          cid: profile.cid,
          actorDid: profile.actorDid,
          handle: profile.user.handle,
          avatar: profile.avatar
            ? {
                cid: profile.avatar.cid,
                mimeType: profile.avatar.mimeType,
                size: profile.avatar.size,
              }
            : undefined,
          description: profile.description,
          displayName: profile.displayName,
          createdAt: profile.createdAt,
          indexedAt: profile.indexedAt,
        }),
    );

    return {
      profiles: profileDetails,
      cursor: nextCursor,
    };
  }
}
