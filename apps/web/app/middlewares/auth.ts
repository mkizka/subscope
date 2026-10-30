import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";
import { data, redirect, type RouterContextProvider } from "react-router";

import { agentContext } from "@/app/context/agent";
import { services } from "@/app/server";

export const getAgent = async (request: Request) => {
  const did = await services.cookieSession.getDid(request);
  return did ? services.oauthClient.restore(did) : null;
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
};
