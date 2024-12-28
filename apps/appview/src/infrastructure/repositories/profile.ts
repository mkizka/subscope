import type { Profile } from "../../domain/models/profile.js";
import type { IProfileRepository } from "../../domain/repositories/profile.js";
import { prisma } from "../prisma.js";

export class ProfileRepository implements IProfileRepository {
  async createOrUpdate(profile: Profile) {
    const { did, ...data } = profile;
    await prisma.profile.upsert({
      create: {
        ...data,
        user: {
          connectOrCreate: {
            where: { did },
            create: { did },
          },
        },
      },
      update: data,
      where: { did },
    });
  }
}
