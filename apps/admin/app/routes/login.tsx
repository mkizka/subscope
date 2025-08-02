import { redirect } from "react-router";

import { oauthClient } from "~/server/oauth/client";
import { getSessionUserDid } from "~/server/oauth/session";

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

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userDid = await getSessionUserDid(request);
  if (userDid) {
    return redirect("/");
  }
  return null;
};

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form method="post">
        <label>
          Identifier:
          <input type="text" name="identifier" required />
        </label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
