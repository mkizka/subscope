import { z } from "zod";

import { authedProcedure, router } from "./trpc.js";

export const appRouter = router({
  inviteCodes: router({
    list: authedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) =>
        ctx.agent.me.subsco.admin.getInviteCodes(input),
      ),
  }),
});

export type AppRouter = typeof appRouter;
