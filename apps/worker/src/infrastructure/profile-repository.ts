import type { TransactionContext } from "@dawn/common/domain";
import type { Profile } from "@dawn/common/domain";
import { type BlobInsert, type ProfileInsert, schema } from "@dawn/db";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  async upsert({
    ctx,
    profile,
  }: {
    ctx: TransactionContext;
    profile: Profile;
  }) {
    if (profile.avatar) {
      const blobData = {
        mimeType: profile.avatar.mimeType,
        size: profile.avatar.size,
      } satisfies BlobInsert;
      await ctx.db
        .insert(schema.blobs)
        .values({
          cid: profile.avatar.cid,
          ...blobData,
        })
        .onConflictDoUpdate({
          target: schema.blobs.cid,
          set: blobData,
        });
    }
    const profileData = {
      cid: profile.cid,
      actorDid: profile.actorDid,
      avatarCid: profile.avatar?.cid,
      description: profile.description,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
    } satisfies ProfileInsert;
    await ctx.db
      .insert(schema.profiles)
      .values({
        uri: profile.uri.toString(),
        ...profileData,
      })
      .onConflictDoUpdate({
        target: schema.profiles.uri,
        set: profileData,
      });
  }
}
