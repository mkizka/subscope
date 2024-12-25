import { PrismaClient } from "@dawn/db";

import type { IUserRepository } from "../application/create-user-use-case.js";
import type { User } from "../domain/models/user.js";

export class UserRepository implements IUserRepository {
  prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async save(user: User) {
    await this.prisma.user.create({
      data: {
        did: user.did,
        avatar: user.avatar,
        description: user.description,
        handle: user.handle,
      },
    });
  }
}
