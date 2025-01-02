import type { TransactionContext } from "@dawn/common/domain";
import { User } from "@dawn/common/domain";

import type { IUserRepository } from "../../application/interfaces/user-repository.js";
import { defaultTransactionContext } from "./transaction.js";

export class UserRepository implements IUserRepository {
  async findOne({
    ctx = defaultTransactionContext,
    did,
  }: {
    ctx?: TransactionContext;
    did: string;
  }) {
    const user = await ctx.prisma.user.findFirst({
      where: {
        did,
      },
    });
    if (!user) {
      return null;
    }
    return new User(user);
  }

  async createOrUpdate({
    ctx = defaultTransactionContext,
    user,
  }: {
    ctx?: TransactionContext;
    user: User;
  }) {
    await ctx.prisma.user.upsert({
      create: user,
      update: user,
      where: {
        did: user.did,
      },
    });
  }
}
