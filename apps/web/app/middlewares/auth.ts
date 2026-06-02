import { data, redirect, type RouterContextProvider } from "react-router";

import { agentContext } from "@/app/context/agent";
import { getAgent } from "@/app/lib/oauth/session.server";

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
  const response = await agent.me.subsco.admin.verifyAccess();
  if (response.data.status !== "authorized") {
    throw data("ログイン中のアカウントが管理者ではありません", { status: 403 });
  }
  context.set(agentContext, agent);
};
