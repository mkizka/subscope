import { Profile } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";
import { db } from "./db.js";

export class ProfileRepository implements IProfileRepository {
  async findOne({ did }: { did: string }) {
    const [row] = await db
      .select()
      .from(schema.profiles)
      .leftJoin(schema.blobs, eq(schema.profiles.avatarCid, schema.blobs.cid))
      .where(eq(schema.profiles.did, did));
    if (!row) {
      return null;
    }
    return new Profile({
      did: row.profiles.did,
      avatar: row.blobs && {
        cid: row.blobs.cid,
        mimeType: row.blobs.mimeType,
        size: row.blobs.size,
      },
      description: row.profiles.description,
      displayName: row.profiles.displayName,
      createdAt: row.profiles.createdAt,
      indexedAt: row.profiles.indexedAt,
    });
  }
}
