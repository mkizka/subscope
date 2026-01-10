import { z } from "zod";

import { publicProcedure, router } from "./trpc.js";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: "ok" };
  }),
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.name}!` };
    }),
});

export type AppRouter = typeof appRouter;
