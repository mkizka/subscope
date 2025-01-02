import type {
  ITransactionManager,
  TransactionContext,
} from "@dawn/common/domain";

import { prisma } from "./prisma.js";

export const defaultTransactionContext: TransactionContext = {
  prisma,
};

export class TransactionManager implements ITransactionManager {
  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await prisma.$transaction((prisma) => fn({ prisma }));
  }
}
