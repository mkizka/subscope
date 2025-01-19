import type { TransactionContext } from "@dawn/common/domain";
import type { Profile } from "@dawn/common/domain";
import { schema } from "@dawn/db";

import type { IProfileRepository } from "../../application/interfaces/profile-repository.js";
import { defaultTransactionContext } from "./transaction.js";

export class ProfileRepository implements IProfileRepository {
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
