import type { ComponentProps } from "react";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

import { LoginForm } from "./blocks/login-form";

type Props = {
  formProps: ComponentProps<"form">;
  inputProps: ComponentProps<"input">;
  fields: {
    identifier: {
      id: string;
      errors?: string[];
    };
  };
};

export function LoginPresenter({ formProps, inputProps, fields }: Props) {
  return (
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
  );
}
