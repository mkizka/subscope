import { ResponseType, XRPCError } from "@atproto/xrpc";
import { redirect } from "react-router";

import { AdminPage } from "@/app/features/admin/page";

import type { Route } from "./+types/admin";

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  if (!context.auth) {
    throw redirect("/login");
  }
  const { agent } = context.auth;

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
