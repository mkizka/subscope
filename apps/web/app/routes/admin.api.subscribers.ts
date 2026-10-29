import { XrpcResponseError } from "@atproto/lex";
import { type DidString, isValidDid } from "@atproto/syntax";
import banSubscriber from "@repo/client/lex/me/subsco/admin/banSubscriber";
import getSubscribers from "@repo/client/lex/me/subsco/admin/getSubscribers";
import grantAdmin from "@repo/client/lex/me/subsco/admin/grantAdmin";
import { data } from "react-router";
import { z } from "zodV4";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.subscribers";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const response = await agent.call(getSubscribers, {
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

  try {
    const { did } = z
      .object({ did: z.custom<DidString>(isValidDid) })
      .parse(await request.json());
    await agent.call(request.method === "DELETE" ? banSubscriber : grantAdmin, {
      did,
    });
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
};
