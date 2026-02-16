import { redirect, type RouterContextProvider } from "react-router";

import { agentContext } from "@/app/context/agent";
import { expressContext } from "@/app/context/express";

export const loginRequiredMiddleware = ({
  context,
}: {
  context: Readonly<RouterContextProvider>;
}) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    throw redirect("/login");
  }
};

export const adminRequiredMiddleware = async ({
  context,
}: {
  context: Readonly<RouterContextProvider>;
}) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    throw redirect("/login");
  }
  const response = await server.agent.me.subsco.admin.verifyAccess();
  if (response.data.status !== "authorized") {
    throw redirect("/login");
  }
  context.set(agentContext, server.agent);
};
