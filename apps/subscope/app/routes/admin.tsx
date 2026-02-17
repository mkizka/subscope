import { ResponseType, XRPCError } from "@atproto/xrpc";
import { redirect } from "react-router";

import { agentContext } from "@/app/context/agent";
import { AdminPage } from "@/app/features/admin/pages/admin";
import { adminRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/admin";

export const middleware: Route.MiddlewareFunction[] = [adminRequiredMiddleware];

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const accessResponse = await agent.me.subsco.admin.verifyAccess();
    if (accessResponse.data.status !== "authorized") {
      throw redirect("/");
    }
  } catch (e) {
    if (
      e instanceof XRPCError &&
      (e.status === ResponseType.AuthenticationRequired ||
        e.status === ResponseType.Forbidden)
    ) {
      throw redirect("/");
    }
    throw e;
  }
};

export default function Admin() {
  return <AdminPage />;
}
