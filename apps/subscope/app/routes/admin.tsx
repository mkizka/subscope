import { ResponseType, XRPCError } from "@atproto/xrpc";
import { redirect } from "react-router";

import { AdminPage } from "@/app/features/admin/page";

import type { Route } from "./+types/admin";

export function meta() {
  return [{ title: "管理画面 - subscope" }];
}

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  if (!context.auth) {
    return redirect("/login");
  }
  try {
    const accessResponse =
      await context.auth.agent.me.subsco.admin.verifyAccess();
    if (accessResponse.data.status !== "authorized") {
      return redirect("/");
    }
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await context.auth.agent.me.subsco.admin.getInviteCodes({
      limit: 50,
      cursor,
    });
    return {
      codes: response.data.codes.map((code) => ({
        code: code.code,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt,
        usedAt: code.usedAt,
        usedBy: code.usedBy
          ? { did: code.usedBy.did, handle: code.usedBy.handle }
          : undefined,
      })),
      nextCursor: response.data.cursor,
    };
  } catch (e) {
    if (
      e instanceof XRPCError &&
      (e.status === ResponseType.AuthenticationRequired ||
        e.status === ResponseType.Forbidden)
    ) {
      return redirect("/");
    }
    throw e;
  }
};

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { codes, nextCursor } = loaderData;
  return <AdminPage codes={codes} nextCursor={nextCursor} />;
}
