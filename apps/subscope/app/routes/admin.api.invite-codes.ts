import { ResponseType, XRPCError } from "@atproto/xrpc";
// eslint-disable-next-line unused-imports/no-unused-imports
import type * as _ from "@repo/client/api";
import { data, redirect } from "react-router";
import { z } from "zod";

import type { Route } from "./+types/admin.api.invite-codes";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  if (!context.auth) {
    throw redirect("/login");
  }
  const { agent } = context.auth;

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.me.subsco.admin.getInviteCodes({
      limit: 20,
      cursor,
    });
    return data(response.data);
  } catch (e) {
    if (
      e instanceof XRPCError &&
      (e.status === ResponseType.AuthenticationRequired ||
        e.status === ResponseType.Forbidden)
    ) {
      throw data({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  if (!context.auth) {
    throw redirect("/login");
  }
  const { agent } = context.auth;

  if (request.method === "DELETE") {
    try {
      const { code } = z
        .object({ code: z.string() })
        .parse(await request.json());
      await agent.me.subsco.admin.deleteInviteCode({ code });
      return data({ success: true });
    } catch (e) {
      if (
        e instanceof XRPCError &&
        (e.status === ResponseType.AuthenticationRequired ||
          e.status === ResponseType.Forbidden)
      ) {
        throw data({ error: "Unauthorized" }, { status: 403 });
      }
      throw e;
    }
  }

  try {
    const response = await agent.me.subsco.admin.createInviteCode({
      daysToExpire: 7,
    });
    return data(response.data);
  } catch (e) {
    if (
      e instanceof XRPCError &&
      (e.status === ResponseType.AuthenticationRequired ||
        e.status === ResponseType.Forbidden)
    ) {
      throw data({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }
};
