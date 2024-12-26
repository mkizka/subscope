import type { Did } from "@atproto/api";

import { prisma } from "./prisma.js";

export class UserRepository {
  async createOrUpdate(createUserDto: { did: Did; handle?: string }) {
    await prisma.user.upsert({
      create: createUserDto,
      update: createUserDto,
      where: {
        did: createUserDto.did,
      },
    });
  }
}
