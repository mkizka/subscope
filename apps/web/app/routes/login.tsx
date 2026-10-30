import { Client, XrpcResponseError } from "@atproto/lex";
import { parseWithZod } from "@conform-to/zod/v4";
import getSetupStatus from "@repo/client/lex/me/subsco/server/getSetupStatus";
import getSubscriptionStatus, {
  subscribed,
} from "@repo/client/lex/me/subsco/sync/getSubscriptionStatus";
import subscribeServer from "@repo/client/lex/me/subsco/sync/subscribeServer";
import { data, redirect } from "react-router";

import { inviteCodeSchema } from "@/app/features/login/blocks/invite-code-form-container";
import { getAgent } from "@/app/middlewares/auth";
import { LoginPage } from "@/app/pages/client/login-page";
import { env } from "@/app/server/shared/env";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "ログイン - Subscope" }];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    const { initialized } = await new Client(env.APPVIEW_URL).call(
      getSetupStatus,
    );
    return data({
      step: initialized ? ("login" as const) : ("setup" as const),
    });
  }

  const response = await agent.call(getSubscriptionStatus);
  if (subscribed.isTypeOf(response)) {
    throw redirect("/");
  }
  return data({ step: "inviteCode" as const });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: inviteCodeSchema });
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

export default function Login({ loaderData }: Route.ComponentProps) {
  return <LoginPage step={loaderData.step} />;
}
