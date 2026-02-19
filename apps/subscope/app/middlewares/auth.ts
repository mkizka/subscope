import { data, redirect, type RouterContextProvider } from "react-router";

import { agentContext } from "@/app/context/agent";
import { expressContext } from "@/app/context/express";

export const loginRequiredMiddleware = ({
  context,
}: {
  context: Readonly<RouterContextProvider>;
}) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    throw redirect("/");
  }
  context.set(agentContext, server.agent);
};

export const adminRequiredMiddleware = async ({
  context,
}: {
  context: Readonly<RouterContextProvider>;
}) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    throw redirect("/");
  }
  const response = await server.agent.me.subsco.admin.verifyAccess();
  if (response.data.status !== "authorized") {
    throw data("ログイン中のアカウントが管理者ではありません", { status: 403 });
  }
  context.set(agentContext, server.agent);
};
