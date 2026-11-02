import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import { listSchema } from "@/app/features/list/blocks/list-form";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListsPage } from "@/app/pages/client/lists-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.lists";

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

export default function Lists({ params }: Route.ComponentProps) {
  return <ListsPage handle={params.handle} />;
}
