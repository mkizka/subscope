import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useActionData } from "react-router";
import { z } from "zodV4";

import { RegisterPage } from "./register";

export const registerSchema = z.object({
  inviteCode: z.string({
    message: "招待コードを入力してください",
  }),
});

type Props = {
  isLoggedIn: boolean;
};

export function RegisterContainer({ isLoggedIn }: Props) {
  const lastResult = useActionData<SubmissionResult>();

  const [form, fields] = useForm({
    id: "register-form",
    lastResult,
    constraint: getZodConstraint(registerSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: registerSchema });
    },
  });

  return (
    <RegisterPage
      isLoggedIn={isLoggedIn}
      activeSubmit={isLoggedIn && form.dirty && form.valid}
      formProps={getFormProps(form)}
      formErrors={form.errors}
      inputProps={getInputProps(fields.inviteCode, { type: "text" })}
      fields={fields}
    />
  );
}
