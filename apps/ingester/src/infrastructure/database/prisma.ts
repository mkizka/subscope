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
//
// prisma.$on("query", (e) => {
//   logger.debug(e.query);
// });
