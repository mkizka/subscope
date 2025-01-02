import type { TransactionContext } from "@dawn/common/domain";
import { PrismaClient } from "@dawn/db";

import { createLogger } from "../shared/logger.js";

export const prisma = new PrismaClient({
  log: [
    {
      level: "query",
      emit: "event",
    },
  ],
});

const logger = createLogger("prisma");

prisma.$on("query", (e) => {
  logger.debug(e.query);
});

export const defaultTransactionContext = {
  prisma,
} satisfies TransactionContext;
