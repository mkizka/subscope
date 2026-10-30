import { XrpcResponseError } from "@atproto/lex";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";

import type { Route } from "./+types/admin.api.invite-codes";

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
