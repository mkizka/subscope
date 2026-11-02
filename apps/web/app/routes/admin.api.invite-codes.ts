import { XrpcResponseError } from "@atproto/lex";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";

import type { Route } from "./+types/admin.api.invite-codes";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const did = context.get(didContext);
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;

  try {
    return data(await di.getInviteCodesUseCase(did, cursor));
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
    if (request.method === "DELETE") {
      const { code } = z
        .object({ code: z.string() })
        .parse(await request.json());
      await di.deleteInviteCodeUseCase(did, code);
      return data({ success: true });
    }
    return data(await di.createInviteCodeUseCase(did));
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
