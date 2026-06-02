import { XRPCError } from "@atproto/xrpc";
import { parseWithZod } from "@conform-to/zod/v4";
import { MeSubscoSyncGetSubscriptionStatus } from "@repo/client/api";
import { data, redirect } from "react-router";

import {
  RegisterContainer,
  registerSchema,
} from "@/app/features/register/pages/register-container";
import { getAgent } from "@/app/lib/oauth/session.server";

import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "アカウント登録 - Subscope" }];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);

  if (agent) {
    const response = await agent.me.subsco.sync.getSubscriptionStatus();
    if (MeSubscoSyncGetSubscriptionStatus.isSubscribed(response.data)) {
      throw redirect("/");
    }
  }

  return data({ isLoggedIn: agent !== null });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/register");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: registerSchema });
  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  try {
    await agent.me.subsco.sync.subscribeServer({
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
