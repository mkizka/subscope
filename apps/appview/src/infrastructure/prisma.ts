import { PrismaClient } from "@prisma/client";

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
  logger.debug({ params: e.params }, e.query);
});
