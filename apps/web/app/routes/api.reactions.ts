import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { reactionSchema } from "@/app/features/timeline/blocks/post-toolbar-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.reactions";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: reactionSchema,
  });
  if (submission.status !== "success") {
    throw data("投稿の指定が不正です", { status: 400 });
  }
  return data(
    await di.toggleReactionUseCase.execute(
      context.get(didContext),
      submission.value,
    ),
  );
};
