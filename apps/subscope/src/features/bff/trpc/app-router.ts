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
      .query(async ({ ctx, input }) => {
        const response = await ctx.agent.me.subsco.admin.getInviteCodes(input);
        return {
          codes: response.data.codes.map((code) => ({
            id: code.code,
            code: code.code,
            createdAt: code.createdAt.split("T")[0] ?? "不明",
            usedBy: code.usedBy?.handle ?? code.usedBy?.did ?? null,
            status: code.usedBy ? "使用済み" : "未使用",
          })),
          cursor: response.data.cursor,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
