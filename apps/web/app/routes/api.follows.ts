import { AtUri, currentDatetimeString, isValidDid } from "@atproto/syntax";
import follow from "@repo/client/lex/app/bsky/graph/follow";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.follows";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);
  const form = await request.formData();
  const followUri = form.get("followUri");
  if (typeof followUri === "string" && followUri) {
    await agent.delete(follow, { rkey: new AtUri(followUri).rkey });
    return data({ uri: null });
  }
  const subject = form.get("did");
  if (typeof subject !== "string" || !isValidDid(subject)) {
    throw data("ユーザーの指定が不正です", { status: 400 });
  }
  const { uri } = await agent.create(follow, {
    subject,
    createdAt: currentDatetimeString(),
  });
  return data({ uri });
};
