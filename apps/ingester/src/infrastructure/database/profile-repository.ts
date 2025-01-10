import type { TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IProfileRepository } from "../../application/interfaces/profile-repository.js";
import { defaultTransactionContext } from "./transaction.js";

export class ProfileRepository implements IProfileRepository {
  async findOne({
    ctx = defaultTransactionContext,
    did,
  }: {
    ctx?: TransactionContext;
    did: string;
  }) {
    const [row] = await ctx.db
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

  async createOrUpdate({
    ctx = defaultTransactionContext,
    profile,
  }: {
    ctx?: TransactionContext;
    profile: Profile;
  }) {
    if (profile.avatar) {
      await ctx.db
        .insert(schema.blobs)
        .values({
          cid: profile.avatar.cid,
          mimeType: profile.avatar.mimeType,
          size: profile.avatar.size,
        })
        .onDuplicateKeyUpdate({
          set: {
            mimeType: profile.avatar.mimeType,
            size: profile.avatar.size,
          },
        });
    }
    await ctx.db
      .insert(schema.profiles)
      .values({
        did: profile.did,
        avatarCid: profile.avatar?.cid,
        description: profile.description,
        displayName: profile.displayName,
        createdAt: profile.createdAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          avatarCid: profile.avatar?.cid,
          description: profile.description,
          displayName: profile.displayName,
          createdAt: profile.createdAt,
        },
      });
  }
}
