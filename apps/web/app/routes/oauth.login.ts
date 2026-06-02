import { parseWithZod } from "@conform-to/zod/v4";
import { data, redirect } from "react-router";

import { loginSchema } from "@/app/features/login/blocks/login-form-container";
import { oauthClient } from "@/app/lib/oauth/client.server";

import type { Route } from "./+types/oauth.login";

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();

  const submission = parseWithZod(formData, { schema: loginSchema });
  if (submission.status !== "success") {
    return data(submission.reply(), { status: 400 });
  }

  try {
    const url = await oauthClient.authorize(submission.value.identifier);
    return redirect(url.toString());
  } catch {
    return redirect("/login?error=auth_failed");
  }
};
