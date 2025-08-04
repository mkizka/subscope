import { redirect } from "react-router";

import { oauthClient } from "~/server/oauth/client";

import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const handle = form.get("identifier");
  if (typeof handle !== "string") {
    throw new Error("Invalid handle type");
  }
  try {
    const url = await oauthClient.authorize(handle);
    return redirect(url.toString());
  } catch (error) {
    // TODO: エラーハンドリング
    throw new Error("Unknown error", { cause: error });
  }
}
