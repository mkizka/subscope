import { initTRPC } from "@trpc/server";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const agent = await ctx.oauthSession.getAgent(ctx.req, ctx.res);
  if (!agent) {
    throw new Error("Unauthorized");
  }
  return next({
    ctx: {
      agent,
    },
  });
});
