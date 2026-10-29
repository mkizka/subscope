import { XrpcResponseError } from "@atproto/lex";
import createInviteCode from "@repo/client/lex/me/subsco/admin/createInviteCode";
import deleteInviteCode from "@repo/client/lex/me/subsco/admin/deleteInviteCode";
import { data } from "react-router";
import { z } from "zodV4";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.invite-codes";

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);

  if (request.method === "DELETE") {
    try {
      const { code } = z
        .object({ code: z.string() })
        .parse(await request.json());
      await agent.call(deleteInviteCode, { code });
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
    const response = await agent.call(createInviteCode, {
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
