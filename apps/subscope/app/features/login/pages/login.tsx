import type { ComponentProps } from "react";
import type { Form } from "react-router";
import { Link } from "react-router";

import { AppLayout } from "@/app/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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
      <div className="flex w-full flex-col gap-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>atprotoでログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm
              formProps={formProps}
              inputProps={inputProps}
              fields={fields}
            />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          はじめて利用する場合は
          <Link
            to="/register"
            className="
              underline underline-offset-4
              hover:text-foreground
            "
          >
            アカウントを登録してください
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}
