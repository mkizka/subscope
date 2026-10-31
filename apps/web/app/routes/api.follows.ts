import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { followSchema } from "@/app/features/profile/blocks/follow-button-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.follows";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: followSchema,
  });
  if (submission.status !== "success") {
    throw data("ユーザーの指定が不正です", { status: 400 });
  }
  return data(
    await di.toggleFollowUseCase.execute(
      context.get(didContext),
      submission.value,
    ),
  );
};
