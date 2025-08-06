import { redirect } from "react-router";
import { z } from "zod";

import { oauthClient } from "~/server/oauth/client";

import type { Route } from "./+types/oauth.login";

const schema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
});

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const input = schema.parse(Object.fromEntries(form));
  const url = await oauthClient.authorize(input.identifier);
  return redirect(url.toString());
}
