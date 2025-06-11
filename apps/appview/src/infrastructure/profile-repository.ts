import { type Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { ProfileDetailed } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, gt, ilike, or } from "drizzle-orm";

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
    const cursorCondition = cursor
      ? gt(schema.profiles.indexedAt, new Date(cursor))
      : undefined;

    const whereConditions = [
      or(
        ilike(schema.profiles.displayName, searchTerm),
        ilike(schema.actors.handle, searchTerm),
      ),
    ];

    if (cursorCondition) {
      whereConditions.push(cursorCondition);
    }

    const profiles = await this.db
      .select({
        uri: schema.profiles.uri,
        cid: schema.profiles.cid,
        actorDid: schema.profiles.actorDid,
        displayName: schema.profiles.displayName,
        description: schema.profiles.description,
        createdAt: schema.profiles.createdAt,
        indexedAt: schema.profiles.indexedAt,
        handle: schema.actors.handle,
        avatarCid: schema.blobs.cid,
        avatarMimeType: schema.blobs.mimeType,
        avatarSize: schema.blobs.size,
      })
      .from(schema.profiles)
      .innerJoin(schema.actors, eq(schema.profiles.actorDid, schema.actors.did))
      .leftJoin(schema.blobs, eq(schema.profiles.avatarCid, schema.blobs.cid))
      .where(and(...whereConditions))
      .orderBy(schema.profiles.indexedAt)
      .limit(limit + 1);

    const hasMore = profiles.length > limit;
    const resultsToReturn = hasMore ? profiles.slice(0, limit) : profiles;
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
          handle: profile.handle,
          avatar: profile.avatarCid
            ? {
                cid: profile.avatarCid,
                mimeType: profile.avatarMimeType!,
                size: profile.avatarSize!,
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
