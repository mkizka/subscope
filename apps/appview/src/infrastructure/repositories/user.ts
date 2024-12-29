import { User } from "../../domain/models/user.js";
import type { TransactionContext } from "../../domain/repositories/transaction-manager.js";
import type { IUserRepository } from "../../domain/repositories/user.js";
import { defaultTransactionContext } from "./transaction-manager.js";

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
