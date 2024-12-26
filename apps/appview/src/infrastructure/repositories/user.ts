import type { User } from "../../domain/models/user.js";
import type { IUserRepository } from "../../domain/repositories/user.js";
import { prisma } from "../prisma.js";

export class UserRepository implements IUserRepository {
  async createOrUpdate(user: User) {
    await prisma.user.upsert({
      create: user,
      update: user,
      where: {
        did: user.did,
      },
    });
  }
}
