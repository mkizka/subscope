import type { ComponentProps } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

import { LoginForm } from "./parts/login-form";

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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Subscopeにログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm
          formProps={formProps}
          inputProps={inputProps}
          fields={fields}
        />
      </CardContent>
    </Card>
  );
}
