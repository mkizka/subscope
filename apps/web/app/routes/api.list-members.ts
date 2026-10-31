import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";

import { didContext } from "@/app/context/did";
import {
  addListMemberSchema,
  removeListMemberSchema,
} from "@/app/features/list/blocks/list-member-forms";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.list-members";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData();
  const did = context.get(didContext);
  if (request.method === "DELETE") {
    const submission = parseWithZod(formData, {
      schema: removeListMemberSchema,
    });
    if (submission.status !== "success") {
      throw data("メンバーの指定が不正です", { status: 400 });
    }
    await di.removeListMemberUseCase.execute(did, submission.value.listItemUri);
    return null;
  }
  const submission = parseWithZod(formData, { schema: addListMemberSchema });
  if (submission.status !== "success") {
    throw data("ハンドルが不正です", { status: 400 });
  }
  await di.addListMemberUseCase.execute(did, submission.value);
  return null;
};
