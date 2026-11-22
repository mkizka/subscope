import { XrpcResponseError } from "@atproto/lex";
import { type DidString, isValidDid } from "@atproto/syntax";
import { parseWithZod } from "@conform-to/zod/v4";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { addMemberSchema } from "@/app/features/admin/add-member-dialog-container";
import { di } from "@/app/server/di";

import type { Route } from "./+types/admin.api.registered-accounts";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const did = context.get(didContext);

  try {
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor") ?? undefined;
    return data(await di.listServerMembersUseCase(did, cursor));
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

const ADD_MEMBER_ERRORS = {
  accountNotFound: "アカウントが見つかりません",
  alreadyRegistered: "すでにメンバーです",
  banned: "登録停止中のアカウントです",
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const did = context.get(didContext);

  try {
    if (request.method === "PUT") {
      const submission = parseWithZod(await request.formData(), {
        schema: addMemberSchema,
      });
      if (submission.status !== "success") {
        return data(submission.reply(), { status: 400 });
      }
      const result = await di.addMemberUseCase(did, submission.value.actor);
      if (result === "added") {
        return data(submission.reply());
      }
      return data(
        submission.reply({ formErrors: [ADD_MEMBER_ERRORS[result]] }),
        { status: 400 },
      );
    }
    const { did: target } = z
      .object({ did: z.custom<DidString>(isValidDid) })
      .parse(await request.json());
    const useCase =
      request.method === "DELETE" ? di.banAccountUseCase : di.grantAdminUseCase;
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
