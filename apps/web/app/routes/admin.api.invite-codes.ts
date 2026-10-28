import { XrpcResponseError } from "@atproto/lex";
import { me } from "@repo/client/lex";
import { data } from "react-router";
import { z } from "zodV4";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.invite-codes";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.call(me.subsco.admin.getInviteCodes, {
      limit: 20,
      cursor,
    });
    return data(response);
  } catch (e) {
    if (
      e instanceof XrpcResponseError &&
      (e.status === 401 || e.status === 403)
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
      await agent.call(me.subsco.admin.deleteInviteCode, { code });
      return data({ success: true });
    } catch (e) {
      if (
        e instanceof XrpcResponseError &&
        (e.status === 401 || e.status === 403)
      ) {
        throw data({ error: "Unauthorized" }, { status: 403 });
      }
      throw e;
    }
  }

  try {
    const response = await agent.call(me.subsco.admin.createInviteCode, {
      daysToExpire: 7,
    });
    return data(response);
  } catch (e) {
    if (
      e instanceof XrpcResponseError &&
      (e.status === 401 || e.status === 403)
    ) {
      throw data({ error: "Unauthorized" }, { status: 403 });
    }
    throw e;
  }
};
