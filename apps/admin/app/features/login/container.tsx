import { useActionData, useNavigation } from "react-router";

import type { action } from "~/routes/oauth.login";

import { LoginPresenter } from "./presenter";

export function LoginContainer() {
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return <LoginPresenter lastResult={lastResult} isSubmitting={isSubmitting} />;
}
