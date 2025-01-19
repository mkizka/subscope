import type { Did } from "@atproto/did";
import { ProfileDetailed } from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";
import type { DatabaseClient } from "@dawn/db";
import { schema } from "@dawn/db";
import { eq, inArray, or } from "drizzle-orm";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findManyDetailed(handleOrDids: (Handle | Did)[]) {
    const rows = await this.db
      .select()
      .from(schema.profiles)
      .innerJoin(schema.users, eq(schema.profiles.did, schema.users.did))
      .leftJoin(schema.blobs, eq(schema.profiles.avatarCid, schema.blobs.cid))
      .where(
        or(
          inArray(schema.profiles.did, handleOrDids),
          inArray(schema.users.handle, handleOrDids),
        ),
      );
    return rows.map(
      (row) =>
        new ProfileDetailed({
          did: row.profiles.did,
          handle: row.users.handle,
          avatar: row.blobs && {
            cid: row.blobs.cid,
            mimeType: row.blobs.mimeType,
            size: row.blobs.size,
          },
          description: row.profiles.description,
          displayName: row.profiles.displayName,
          createdAt: row.profiles.createdAt,
          indexedAt: row.profiles.indexedAt,
        }),
    );
  }
}
