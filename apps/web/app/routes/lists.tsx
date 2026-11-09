import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { listSchema } from "@/app/features/list/list-form";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { MyListsPage } from "@/app/pages/client/my-lists-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/lists";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const submission = parseWithZod(await request.formData(), {
    schema: listSchema,
  });
  if (submission.status !== "success") {
    throw data("リストの内容が不正です", { status: 400 });
  }
  await di.createListUseCase.execute(context.get(didContext), submission.value);
  return null;
};

export function meta() {
  return [{ title: "リスト - Subscope" }];
}

export default function Lists() {
  return <MyListsPage />;
}
