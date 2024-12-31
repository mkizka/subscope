import type { TransactionContext } from "../../domain/interfaces/transaction.js";
import { Profile } from "../../domain/profile/profile.js";
import type { IProfileRepository } from "../../domain/profile/profile-repository.js";
import { defaultTransactionContext } from "./transaction-manager.js";

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
    await ctx.prisma.profile.upsert({
      create: {
        did: profile.did,
        avatarCid: profile.avatar?.cid,
        description: profile.description,
        displayName: profile.displayName,
      },
      update: {
        avatarCid: profile.avatar?.cid,
        description: profile.description,
        displayName: profile.displayName,
      },
      where: {
        did: profile.did,
      },
    });
  }
}
