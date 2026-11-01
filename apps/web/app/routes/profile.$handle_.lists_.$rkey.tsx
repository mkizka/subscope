import { isAtIdentifierString } from "@atproto/syntax";
import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect, useNavigation, useSubmit } from "react-router";

import { didContext } from "@/app/context/did";
import { listSchema } from "@/app/features/list/blocks/list-form";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ListPage } from "@/app/pages/client/list-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/profile.$handle_.lists_.$rkey";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({
  params,
  request,
  context,
}: Route.LoaderArgs) => {
  if (!isAtIdentifierString(params.handle)) {
    throw data("リストが見つかりません", { status: 404 });
  }
  const tab: "posts" | "members" =
    new URL(request.url).searchParams.get("tab") === "members"
      ? "members"
      : "posts";
  const result = await di.getListPageUseCase.execute(
    context.get(didContext),
    params.handle,
    params.rkey,
    tab,
  );
  return data({ ...result, tab });
};

export const action = async ({
  params,
  request,
  context,
}: Route.ActionArgs) => {
  const formData = await request.formData();
  if (formData.get("intent") === "delete") {
    await di.deleteListUseCase.execute(context.get(didContext), params.rkey);
    return redirect(`/profile/${params.handle}/lists`);
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

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData.list.name} - Subscope` }];
}

export default function List({ loaderData }: Route.ComponentProps) {
  const { list, ...rest } = loaderData;
  const submit = useSubmit();
  const navigation = useNavigation();
  return (
    <ListPage
      uri={list.uri}
      name={list.name}
      description={list.description}
      {...rest}
      deleting={navigation.formData?.get("intent") === "delete"}
      onDelete={() => submit({ intent: "delete" }, { method: "post" })}
    />
  );
}
