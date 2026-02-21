import type { ComponentProps } from "react";

import { AppLayout } from "@/app/components/layout";
import { RegisterCard } from "@/app/features/register/blocks/register-card";

type Props = {
  isLoggedIn: boolean;
  activeSubmit?: boolean;
  formProps: ComponentProps<"form">;
  formErrors?: string[];
  inputProps: ComponentProps<"input">;
  fields: {
    inviteCode: {
      id: string;
      errors?: string[];
    };
  };
};

export function RegisterPage({
  isLoggedIn,
  activeSubmit,
  formProps,
  formErrors,
  inputProps,
  fields,
}: Props) {
  return (
    <AppLayout verticalCenter>
      <RegisterCard
        isLoggedIn={isLoggedIn}
        activeSubmit={activeSubmit}
        formProps={formProps}
        formErrors={formErrors}
        inputProps={inputProps}
        fields={fields}
      />
    </AppLayout>
  );
}
