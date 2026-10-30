import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";
import { data, redirect, type RouterContextProvider } from "react-router";

import { agentContext } from "@/app/context/agent";
import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";

export const getAgent = async (request: Request) => {
  const did = await di.cookieSessionStorage.getDid(
    request.headers.get("Cookie"),
  );
  return did ? di.oauthClient.restore(did) : null;
};

export const loginRequiredMiddleware = async ({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  context.set(agentContext, agent);
  context.set(didContext, agent.assertDid);
};

export const adminRequiredMiddleware = async ({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  const response = await agent.call(verifyAccess);
  if (response.status !== "authorized") {
    throw data("ログイン中のアカウントが管理者ではありません", { status: 403 });
  }
  context.set(agentContext, agent);
  context.set(didContext, agent.assertDid);
};
