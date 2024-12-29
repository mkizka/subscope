import type { Profile } from "../../domain/models/profile.js";
import { ProfileDetailed } from "../../domain/models/profile-detailed.js";
import type { IProfileRepository } from "../../domain/repositories/profile.js";
import type { TransactionContext } from "../../domain/repositories/transaction-manager.js";

export class ProfileRepository implements IProfileRepository {
  async findOne({ ctx, did }: { ctx: TransactionContext; did: string }) {
    const profile = await ctx.prisma.profile.findFirst({
      where: { user: { did } },
      include: { user: true },
    });
    if (!profile) {
      return null;
    }
    return new ProfileDetailed({
      did: profile.user.did,
      handle: profile.user.handle,
      avatar: profile.avatar,
      description: profile.description,
      displayName: profile.displayName,
    });
  }

  async createOrUpdate({
    ctx,
    profile,
  }: {
    ctx: TransactionContext;
    profile: Profile;
  }) {
    const { did, ...data } = profile;
    await ctx.prisma.profile.upsert({
      create: {
        did,
        ...data,
      },
      update: data,
      where: { did },
    });
  }
}
