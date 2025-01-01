import { Profile } from "../../domain/profile/profile.js";
import type { IProfileRepository } from "../../domain/profile/profile-repository.js";
import { prisma } from "./prisma.js";

export class ProfileRepository implements IProfileRepository {
  async findOne({ did }: { did: string }) {
    const profile = await prisma.profile.findFirst({
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
