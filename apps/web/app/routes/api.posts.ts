import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";

import { didContext } from "@/app/context/did";
import { deletePostSchema } from "@/app/features/post/post-toolbar-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.posts";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: deletePostSchema,
  });
  if (submission.status !== "success") {
    throw data("投稿の指定が不正です", { status: 400 });
  }
  await di.deletePostUseCase.execute(
    context.get(didContext),
    submission.value.uri,
  );
  if (submission.value.redirectTo) {
    return redirect(submission.value.redirectTo);
  }
  return data({ ok: true });
};
