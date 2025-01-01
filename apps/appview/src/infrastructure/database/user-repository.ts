import { User } from "../../domain/user/user.js";
import type { IUserRepository } from "../../domain/user/user-repository.js";
import { prisma } from "./prisma.js";

export class UserRepository implements IUserRepository {
  async findOne({ did }: { did: string }) {
    const user = await prisma.user.findFirst({
      where: {
        did,
      },
    });
    if (!user) {
      return null;
    }
    return new User(user);
  }
}
