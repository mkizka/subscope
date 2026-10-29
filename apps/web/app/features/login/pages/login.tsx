import type { ComponentProps } from "react";
import type { Form } from "react-router";
import { Link } from "react-router";

import { AppLayout } from "@/app/components/app-layout";
import { LoginForm } from "@/app/features/login/blocks/login-form";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  fields: {
    identifier: {
      id: string;
      errors?: string[];
    };
  };
};

export function LoginPage({ formProps, inputProps, fields }: Props) {
  return (
    <AppLayout verticalCenter>
      <div className="flex flex-col gap-4">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">atprotoでログイン</h2>
            <LoginForm
              formProps={formProps}
              inputProps={inputProps}
              fields={fields}
            />
          </div>
        </div>
        <p className="text-center text-sm text-base-content/70">
          はじめて利用する場合は
          <Link to="/register" className="link">
            アカウントを登録してください
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}
