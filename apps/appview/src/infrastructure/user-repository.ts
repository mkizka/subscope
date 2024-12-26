import type { Did } from "@atproto/api";
import { PrismaClient } from "@dawn/db";

export class UserRepository {
  prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(createUserDto: { did: Did; handle?: string }) {
    await this.prisma.user.create({
      data: {
        did: createUserDto.did,
        handle: createUserDto.handle,
      },
    });
  }
}
