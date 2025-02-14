import type { Did } from "@atproto/did";
import type { TransactionContext } from "@dawn/common/domain";
import type { Profile } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { eq } from "drizzle-orm";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  async exists({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const rows = await ctx.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.actorDid, did.toString()))
      .limit(1);
    return rows.length > 0;
  }

  async upsert({
    ctx,
    profile,
  }: {
    ctx: TransactionContext;
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
        .onConflictDoUpdate({
          target: schema.blobs.cid,
          set: {
            mimeType: profile.avatar.mimeType,
            size: profile.avatar.size,
          },
        });
    }
    await ctx.db
      .insert(schema.profiles)
      .values({
        uri: profile.uri.toString(),
        cid: profile.cid,
        actorDid: profile.actorDid,
        avatarCid: profile.avatar?.cid,
        description: profile.description,
        displayName: profile.displayName,
        createdAt: profile.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.profiles.uri,
        set: {
          avatarCid: profile.avatar?.cid,
          description: profile.description,
          displayName: profile.displayName,
          createdAt: profile.createdAt,
        },
      });
  }
}
