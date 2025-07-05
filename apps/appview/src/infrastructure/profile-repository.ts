import { type Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { ProfileDetailed } from "@repo/common/domain";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";

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

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.actorDid,
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
      ]),
    );

    return dids
      .map((did) => profileMap.get(did.toString()))
      .filter((profile) => !!profile);
  }
}
