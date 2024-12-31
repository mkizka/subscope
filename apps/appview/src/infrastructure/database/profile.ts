import type { Profile } from "../../domain/models/profile.js";
import { ProfileDetailed } from "../../domain/models/profile-detailed.js";
import type { IProfileRepository } from "../../domain/repositories/profile.js";
import type { TransactionContext } from "../../domain/repositories/transaction.js";
import { defaultTransactionContext } from "./transaction.js";

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
    return new ProfileDetailed({
      did: profile.user.did,
      handle: profile.user.handle,
      avatar: profile.avatar && {
        cid: profile.avatar.cid,
        mimeType: profile.avatar.mimeType,
        size: profile.avatar.size,
      },
      description: profile.description,
      displayName: profile.displayName,
    });
  }

  async createOrUpdate({
    ctx = defaultTransactionContext,
    profile,
  }: {
    ctx?: TransactionContext;
    profile: Profile;
  }) {
    await ctx.prisma.profile.upsert({
      create: {
        did: profile.did,
        avatarCid: profile.avatarCid,
        description: profile.description,
        displayName: profile.displayName,
      },
      update: {
        avatarCid: profile.avatarCid,
        description: profile.description,
        displayName: profile.displayName,
      },
      where: {
        did: profile.did,
      },
    });
    if (!profile.avatar) {
      return;
    }
    await ctx.prisma.blob.upsert({
      create: {
        cid: profile.avatar.cid,
        mimeType: profile.avatar.mimeType,
        size: profile.avatar.size,
      },
      update: {
        mimeType: profile.avatar.mimeType,
        size: profile.avatar.size,
      },
      where: {
        cid: profile.avatar.cid,
      },
    });
  }
}
