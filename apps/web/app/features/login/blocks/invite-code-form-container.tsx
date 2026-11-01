import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useActionData } from "react-router";
import { z } from "zodV4";

import { InviteCodeForm } from "./invite-code-form";

export const inviteCodeSchema = z.object({
  inviteCode: z.string({
    message: "招待コードを入力してください",
  }),
});

export function InviteCodeFormContainer() {
  const lastResult = useActionData<SubmissionResult>();
  const [form, fields] = useForm({
    id: "invite-code-form",
    lastResult,
    constraint: getZodConstraint(inviteCodeSchema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: inviteCodeSchema });
    },
  });

  return (
    <InviteCodeForm
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.inviteCode, { type: "text" })}
      error={(form.errors ?? fields.inviteCode.errors)?.[0]}
    />
  );
}
