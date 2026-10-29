import { asAtUriString, AtUri, currentDatetimeString } from "@atproto/syntax";
import like from "@repo/client/lex/app/bsky/feed/like";
import repost from "@repo/client/lex/app/bsky/feed/repost";
import { data } from "react-router";

import { agentContext } from "@/app/context/agent";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/api.reactions";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);
  const form = await request.formData();
  const schema = form.get("type") === "repost" ? repost : like;
  const recordUri = form.get("recordUri");
  if (typeof recordUri === "string" && recordUri) {
    await agent.delete(schema, { rkey: new AtUri(recordUri).rkey });
    return data({ uri: null });
  }
  const subjectUri = form.get("uri");
  const cid = form.get("cid");
  if (typeof subjectUri !== "string" || typeof cid !== "string") {
    throw data("投稿の指定が不正です", { status: 400 });
  }
  const { uri } = await agent.create(schema, {
    subject: { uri: asAtUriString(subjectUri), cid },
    createdAt: currentDatetimeString(),
  });
  return data({ uri });
};
