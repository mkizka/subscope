import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";

import { inviteCodeSchema } from "@/app/features/login/blocks/invite-code-form-container";
import { getAgent } from "@/app/middlewares/auth";
import { LoginPage } from "@/app/pages/client/login-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "ログイン - Subscope" }];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const agent = await getAgent(request);
  const step = await di.getLoginStepUseCase.execute(agent?.assertDid ?? null);
  if (step === "subscribed") {
    throw redirect("/");
  }
  return data({ step });
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

  const result = await di.subscribeServerUseCase.execute(
    agent.assertDid,
    submission.value.inviteCode,
  );
  switch (result) {
    case "subscribed":
      return redirect("/");
    case "invalidInviteCode":
      return data(
        submission.reply({
          formErrors: ["招待コードが無効または期限切れです"],
        }),
        { status: 400 },
      );
    case "failed":
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
