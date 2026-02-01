import { isValidHandle } from "@atproto/syntax";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod";

import { LoginPresenter } from "./presenter";

export const LoginContainer = () => {
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
    <LoginPresenter
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.identifier, { type: "text" })}
      fields={fields}
    />
  );
};
