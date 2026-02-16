import { ResponseType, XRPCError } from "@atproto/xrpc";
// eslint-disable-next-line unused-imports/no-unused-imports
import type * as _ from "@repo/client/api";
import { data } from "react-router";
import { z } from "zod";

import { agentContext } from "@/app/context/agent";
import { adminRequiredMiddleware } from "@/app/middlewares/auth";

import type { Route } from "./+types/admin.api.invite-codes";

export const middleware: Route.MiddlewareFunction[] = [adminRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

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
  const agent = context.get(agentContext);

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
