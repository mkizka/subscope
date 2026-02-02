import { AtSign } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/app/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/card";
import { Field, FieldError, FieldLabel } from "@/app/components/field";
import { Input } from "@/app/components/input";

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
        <form
          action="/oauth/login"
          method="POST"
          className="space-y-4"
          {...formProps}
        >
          <Field>
            <FieldLabel htmlFor={fields.identifier.id}>ハンドル</FieldLabel>
            <div className="relative flex items-center">
              <AtSign className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
              <Input
                className="pl-9"
                placeholder="example.bsky.social"
                autoComplete="username"
                {...inputProps}
              />
            </div>
            <FieldError errors={fields.identifier.errors} />
          </Field>
          <Button type="submit" className="w-full">
            ログイン
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
