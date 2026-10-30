import { XrpcResponseError } from "@atproto/lex";
import { type DidString, isValidDid } from "@atproto/syntax";
import getBannedActors from "@repo/client/lex/me/subsco/admin/getBannedActors";
import unbanActor from "@repo/client/lex/me/subsco/admin/unbanActor";
import { data } from "react-router";
import { z } from "zodV4";

import { agentContext } from "@/app/context/agent";

import type { Route } from "./+types/admin.api.banned-actors";

const handleError = (e: unknown) => {
  if (
    e instanceof XrpcResponseError &&
    (e.status === 401 || e.status === 403)
  ) {
    return data({ error: "Unauthorized" }, { status: 403 });
  }
  return e;
};

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  try {
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    return data(await agent.call(getBannedActors, { limit: 20, cursor }));
  } catch (e) {
    throw handleError(e);
  }
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const agent = context.get(agentContext);
  try {
    const { did } = z
      .object({ did: z.custom<DidString>(isValidDid) })
      .parse(await request.json());
    await agent.call(unbanActor, { did });
    return data({ success: true });
  } catch (e) {
    throw handleError(e);
  }
};
