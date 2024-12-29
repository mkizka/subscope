import type {
  ITransactionManager,
  TransactionContext,
} from "../../domain/repositories/transaction-manager.js";
import { prisma } from "../prisma.js";

export class TransactionManager implements ITransactionManager {
  async transaction<T>(
    fn: (ctx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    return await prisma.$transaction((prisma) => fn({ prisma }));
  }
}
