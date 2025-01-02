import type { TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IProfileRepository } from "../application/interfaces/profile-repository.js";
import { defaultTransactionContext } from "./prisma.js";

export class ProfileRepository implements IProfileRepository {
  async findOne({
    ctx = defaultTransactionContext,
    did,
  }: {
    ctx?: TransactionContext;
    did: string;
  }) {
    const profile = await ctx.prisma.profile.findFirst({
      where: { user: { did } },
      include: { user: true, avatar: true },
    });
    if (!profile) {
      return null;
    }
    return new Profile({
      did: profile.user.did,
      avatar: profile.avatar && {
        cid: profile.avatar.cid,
        mimeType: profile.avatar.mimeType,
        size: profile.avatar.size,
      },
      description: profile.description,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
      indexedAt: profile.indexedAt,
    });
  }
}
