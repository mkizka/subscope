import { XrpcResponseError } from "@atproto/lex";
import { parseWithZod } from "@conform-to/zod/v4";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";
import { data, redirect } from "react-router";

import { registerSchema } from "@/app/features/register/blocks/register-card-container";
import { getAgent } from "@/app/lib/oauth/session.server";
import { RegisterPage } from "@/app/pages/register-page";

import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "アカウント登録 - Subscope" }];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);

  if (agent) {
    const response = await agent.call(getSubscriptionStatus);
    if (subscribed.isTypeOf(response)) {
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
    await agent.call(subscribeServer, {
      inviteCode: submission.value.inviteCode,
    });
    return redirect("/");
  } catch (e) {
    if (e instanceof XrpcResponseError) {
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
  return <RegisterPage isLoggedIn={loaderData.isLoggedIn} />;
}
