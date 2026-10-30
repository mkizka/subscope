import { XrpcResponseError } from "@atproto/lex";
import { type DidString, isValidDid } from "@atproto/syntax";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";

import type { Route } from "./+types/admin.api.subscribers";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const did = context.get(didContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    return data(await di.getSubscribersUseCase(did, cursor));
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
  const did = context.get(didContext);

  try {
    const { did: target } = z
      .object({ did: z.custom<DidString>(isValidDid) })
      .parse(await request.json());
    const useCase =
      request.method === "DELETE"
        ? di.banSubscriberUseCase
        : di.grantAdminUseCase;
    await useCase(did, target);
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
