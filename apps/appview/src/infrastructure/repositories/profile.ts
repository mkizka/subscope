import type { Profile } from "../../domain/models/profile.js";
import type { IProfileRepository } from "../../domain/repositories/profile.js";
import { prisma } from "../prisma.js";

export class ProfileRepository implements IProfileRepository {
  async createOrUpdate(profile: Profile) {
    await prisma.profile.upsert({
      create: profile,
      update: profile,
      where: {
        did: profile.did,
      },
    });
  }
}
