import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getHTTPStatusCodeFromError,
  queryClient,
  trpc,
} from "../../../lib/trpc.js";
import { AccessControlPresenter } from "./presenter.js";

type AccessControlContainerProps = {
  children: preact.ComponentChildren;
};

export function AccessControlContainer({
  children,
}: AccessControlContainerProps) {
  const { data, isLoading, error } = useQuery(
    trpc.admin.verifyAccess.queryOptions(),
  );

  const registerMutation = useMutation(
    trpc.admin.register.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.verifyAccess.queryKey(),
        });
      },
    }),
  );

  const handleRegister = () => {
    registerMutation.mutate();
  };

  const statusCode = error ? getHTTPStatusCodeFromError(error) : null;
  const shouldShowLoading = isLoading || statusCode === 401;

  return (
    <AccessControlPresenter
      isLoading={shouldShowLoading}
      error={error && statusCode !== 401 ? error : null}
      status={data?.status}
      isRegistering={registerMutation.isPending}
      onRegister={handleRegister}
    >
      {children}
    </AccessControlPresenter>
  );
}
