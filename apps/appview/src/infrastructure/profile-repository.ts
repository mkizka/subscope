import { ProfileDetailed } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { inArray, or } from "drizzle-orm";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";
import { db } from "./db.js";

export class ProfileRepository implements IProfileRepository {
  async findManyDetailed({ handleOrDids }: { handleOrDids: string[] }) {
    const profiles = await db.query.profiles.findMany({
      where: or(
        inArray(schema.profiles.did, handleOrDids),
        inArray(schema.users.handle, handleOrDids),
      ),
      with: {
        user: true,
        avatar: true,
      },
    });
    return profiles.map(
      (profile) =>
        new ProfileDetailed({
          did: profile.did,
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
}
