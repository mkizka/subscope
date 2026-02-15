import { ResponseType, XRPCError } from "@atproto/xrpc";
// eslint-disable-next-line unused-imports/no-unused-imports
import type { MeSubscoAdminGetInviteCodes as _ } from "@repo/client/api";
import { redirect } from "react-router";

import { AdminPage } from "@/app/features/admin/page";

import type { Route } from "./+types/admin";

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  if (!context.auth) {
    throw redirect("/login");
  }
  const { agent } = context.auth;

  try {
    const accessResponse = await agent.me.subsco.admin.verifyAccess();
    if (accessResponse.data.status !== "authorized") {
      throw redirect("/");
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.me.subsco.admin.getInviteCodes({
      limit: 10,
      cursor,
    });
    return response.data;
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

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { codes, cursor } = loaderData;
  return <AdminPage codes={codes} nextCursor={cursor} />;
}
