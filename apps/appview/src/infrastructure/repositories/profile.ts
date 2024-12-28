import { Profile } from "../../domain/models/profile.js";
import type { IProfileRepository } from "../../domain/repositories/profile.js";
import { prisma } from "../prisma.js";

export class ProfileRepository implements IProfileRepository {
  async findOne(did: string) {
    const profile = await prisma.profile.findFirst({
      where: { user: { did } },
      include: { user: true },
    });
    if (!profile) {
      return null;
    }
    return new Profile({
      did: profile.user.did,
      // @ts-expect-error
      handle: profile.user.handle, // TODO: handleを必須にしたい
      avatar: profile.avatar,
      description: profile.description,
      displayName: profile.displayName,
    });
  }

  async createOrUpdate(profile: Profile) {
    const { did, handle, ...data } = profile;
    await prisma.profile.upsert({
      create: {
        ...data,
        user: {
          connectOrCreate: {
            where: { did },
            create: { did, handle },
          },
        },
      },
      update: data,
      where: { did },
    });
  }
}
