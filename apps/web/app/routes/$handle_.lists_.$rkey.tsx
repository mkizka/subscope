import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";

import { didContext } from "@/app/context/did";
import { listSchema } from "@/app/features/list/blocks/list-form";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListPage } from "@/app/pages/client/list-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/$handle_.lists_.$rkey";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({
  params,
  request,
  context,
}: Route.ActionArgs) => {
  const formData = await request.formData();
  if (formData.get("intent") === "delete") {
    await di.deleteListUseCase.execute(context.get(didContext), params.rkey);
    return redirect(`/${params.handle}/lists`);
  }
  const submission = parseWithZod(formData, {
    schema: listSchema,
  });
  if (submission.status !== "success") {
    throw data("リストの内容が不正です", { status: 400 });
  }
  await di.updateListUseCase.execute(
    context.get(didContext),
    params.rkey,
    submission.value,
  );
  return null;
};

export function meta() {
  return [{ title: "リスト - Subscope" }];
}

export default function List({ params }: Route.ComponentProps) {
  return <ListPage handle={params.handle} rkey={params.rkey} />;
}
