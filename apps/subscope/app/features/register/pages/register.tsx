import type { ComponentProps } from "react";

import { AppLayout } from "@/app/components/layout";
import { RegisterCard } from "@/app/features/register/blocks/register-card";

type Props = {
  isLoggedIn: boolean;
  activeSubmit?: boolean;
  formProps: ComponentProps<"form">;
  inputProps: ComponentProps<"input">;
  fields: {
    inviteCode: {
      id: string;
      errors?: string[];
    };
  };
  error?: string;
};

export function RegisterPage({
  isLoggedIn,
  activeSubmit,
  formProps,
  inputProps,
  fields,
  error,
}: Props) {
  return (
    <AppLayout verticalCenter>
      <RegisterCard
        isLoggedIn={isLoggedIn}
        activeSubmit={activeSubmit}
        formProps={formProps}
        inputProps={inputProps}
        fields={fields}
        error={error}
      />
    </AppLayout>
  );
}
