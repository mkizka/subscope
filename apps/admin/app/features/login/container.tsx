import { useActionData } from "react-router";

import type { action } from "~/routes/oauth.login";

import { LoginPresentation } from "./presentation";

export function LoginContainer() {
  const lastResult = useActionData<typeof action>();

  return <LoginPresentation lastResult={lastResult} />;
}
