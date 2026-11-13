import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { pinPostSchema } from "@/app/features/post/post-toolbar-container";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.pinned-post";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: pinPostSchema,
  });
  if (submission.status !== "success") {
    throw data("投稿の指定が不正です", { status: 400 });
  }
  const { uri, cid, pinned } = submission.value;
  const did = context.get(didContext);
  if (!uri.startsWith(`at://${did}/`)) {
    throw data("他のアカウントの投稿はピン留めできません", { status: 403 });
  }
  await di.postCommand.pin(did, pinned === "true" ? { uri, cid } : undefined);
  return data({ pinned: pinned === "true" });
};
