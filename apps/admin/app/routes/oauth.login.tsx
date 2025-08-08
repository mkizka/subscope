import { parseWithZod } from "@conform-to/zod/v4";
import { redirect } from "react-router";

import { loginSchema } from "~/schemas/login.schema";
import { oauthClient } from "~/server/oauth/client";

import type { Route } from "./+types/oauth.login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: loginSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  try {
    const url = await oauthClient.authorize(submission.value.identifier);
    return redirect(url.toString());
  } catch (error) {
    // ビジネスロジックエラーをフォームエラーとして返す
    return submission.reply({
      formErrors: ["認証に失敗しました。もう一度お試しください。"],
    });
  }
}
