import { XRPCError } from "@atproto/xrpc";
import { parseWithZod } from "@conform-to/zod/v4";
import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { data, redirect } from "react-router";

import { expressContext } from "@/app/context/express";
import {
  RegisterContainer,
  registerSchema,
} from "@/app/features/register/pages/register-container";

import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "アカウント登録 - Subscope" }];
}

export const loader = async ({ context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);

  if (server.agent) {
    const response = await server.agent.me.subsco.sync.getSubscriptionStatus();
    if (MeSubscoSyncGetSubscriptionStatus.isSubscribed(response.data)) {
      throw redirect("/");
    }
  }

  return data({ isLoggedIn: server.agent !== null });
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const server = context.get(expressContext);
  if (!server.agent) {
    throw redirect("/register");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: registerSchema });
  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  try {
    await server.agent.me.subsco.sync.subscribeServer({
      inviteCode: submission.value.inviteCode,
    });
    return redirect("/");
  } catch (e) {
    if (e instanceof XRPCError) {
      switch (e.error) {
        case "InvalidInviteCode":
          return data(
            submission.reply({
              formErrors: ["招待コードが無効または期限切れです"],
            }),
            { status: 400 },
          );
        case "AlreadySubscribed":
          return redirect("/");
      }
    }
    return data(
      submission.reply({
        formErrors: ["登録に失敗しました。もう一度お試しください"],
      }),
      { status: 500 },
    );
  }
};

export default function Register({ loaderData }: Route.ComponentProps) {
  return <RegisterContainer isLoggedIn={loaderData.isLoggedIn} />;
}
