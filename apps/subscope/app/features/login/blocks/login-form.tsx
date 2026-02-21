import { AtSign } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/app/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

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

export function LoginForm({ formProps, inputProps, fields }: Props) {
  return (
    <form
      action="/oauth/login"
      method="POST"
      className="flex flex-col gap-4"
      {...formProps}
    >
      <Field>
        <FieldLabel htmlFor={fields.identifier.id}>ハンドル</FieldLabel>
        <div className="relative flex items-center">
          <AtSign
            className="
              pointer-events-none absolute left-3 size-4 text-muted-foreground
            "
          />
          <Input
            className="pl-9"
            placeholder="example.bsky.social"
            autoComplete="username"
            {...inputProps}
          />
        </div>
        <FieldError errors={fields.identifier.errors} />
      </Field>
      <div className="flex justify-center">
        <Button type="submit" className="w-fit">
          ログイン
        </Button>
      </div>
    </form>
  );
}
