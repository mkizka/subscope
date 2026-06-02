import { isValidHandle } from "@atproto/syntax";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { z } from "zodV4";

import { LoginForm } from "./login-form";

export const loginSchema = z.object({
  identifier: z
    .string({
      message: "ハンドルを入力してください",
    })
    .refine(isValidHandle, {
      message: "有効なハンドルを入力してください",
    }),
});

export const LoginFormContainer = () => {
  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(loginSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
  });

  return (
    <LoginForm
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.identifier, { type: "text" })}
      fields={fields}
    />
  );
};
