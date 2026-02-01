import { isValidHandle } from "@atproto/syntax";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { AtSign } from "lucide-react";
import { z } from "zod";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

export default function Login() {
  const schema = z.object({
    identifier: z
      .string({
        message: "ハンドルを入力してください",
      })
      .refine(isValidHandle, {
        message: "有効なハンドルを入力してください",
      }),
  });

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Subscopeにログイン</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action="/oauth/login"
          method="POST"
          className="space-y-4"
          {...getFormProps(form)}
        >
          <Field>
            <FieldLabel htmlFor={fields.identifier.id}>ハンドル</FieldLabel>
            <div className="relative flex items-center">
              <AtSign className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
              <Input
                className="pl-9"
                placeholder="example.bsky.social"
                autoComplete="username"
                {...getInputProps(fields.identifier, { type: "text" })}
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
