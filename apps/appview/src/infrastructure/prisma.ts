import type { TransactionContext } from "@dawn/common/domain";
import { createPrisma } from "@dawn/db";

export const prisma = createPrisma({
  log: [
    {
      level: "query",
      emit: "event",
    },
  ],
});

// const logger = createLogger("prisma");

// prisma.$on("query", (e) => {
//   logger.debug(e.query);
// });

export const defaultTransactionContext = {
  prisma,
} satisfies TransactionContext;
