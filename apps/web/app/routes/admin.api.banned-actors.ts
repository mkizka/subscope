import { XrpcResponseError } from "@atproto/lex";
import { type DidString, isValidDid } from "@atproto/syntax";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";

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
  const did = context.get(didContext);
  try {
    const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
    return data(await di.getBannedActorsUseCase(did, cursor));
  } catch (e) {
    throw handleError(e);
  }
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const did = context.get(didContext);
  try {
    const { did: target } = z
      .object({ did: z.custom<DidString>(isValidDid) })
      .parse(await request.json());
    await di.unbanActorUseCase(did, target);
    return data({ success: true });
  } catch (e) {
    throw handleError(e);
  }
};
