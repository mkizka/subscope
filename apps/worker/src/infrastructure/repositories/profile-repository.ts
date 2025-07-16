import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Profile } from "@repo/common/domain";
import { type ProfileInsert, schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IProfileRepository } from "../../application/interfaces/repositories/profile-repository.js";

export class ProfileRepository implements IProfileRepository {
  async upsert({
    ctx,
    profile,
  }: {
    ctx: TransactionContext;
    profile: Profile;
  }) {
    const profileData = {
      cid: profile.cid,
      actorDid: profile.actorDid,
      avatarCid: profile.avatarCid,
      description: profile.description,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
    } satisfies ProfileInsert;
    await ctx.db
      .insert(schema.profiles)
      .values({
        uri: profile.uri.toString(),
        indexedAt: profile.indexedAt,
        ...profileData,
      })
      .onConflictDoUpdate({
        target: schema.profiles.uri,
        set: profileData,
      });
  }

  async exists({
    ctx,
    actorDid,
  }: {
    ctx: TransactionContext;
    actorDid: Did;
  }): Promise<boolean> {
    const result = await ctx.db
      .select({ uri: schema.profiles.uri })
      .from(schema.profiles)
      .where(eq(schema.profiles.actorDid, actorDid))
      .limit(1);
    return result.length > 0;
  }
}
