import { isValidHandle } from "@atproto/syntax";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useNavigation } from "react-router";
import { z } from "zodV4";

import { LoginForm } from "./login-form";

const identifierSchema = z
  .string({
    message: "ハンドルを入力してください",
  })
  .refine(isValidHandle, {
    message: "有効なハンドルを入力してください",
  });

export const loginSchema = z.object({
  identifier: identifierSchema,
  inviteCode: z.string().optional(),
});

const registerSchema = z.object({
  identifier: identifierSchema,
  inviteCode: z.string({
    message: "招待コードを入力してください",
  }),
});

export const LoginFormContainer = ({
  withInviteCode = false,
}: {
  withInviteCode?: boolean;
}) => {
  const schema = withInviteCode ? registerSchema : loginSchema;
  const navigation = useNavigation();
  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    shouldValidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <LoginForm
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.identifier, { type: "text" })}
      inviteCodeInputProps={
        withInviteCode
          ? getInputProps(fields.inviteCode, { type: "text" })
          : undefined
      }
      inviteCodeError={fields.inviteCode.errors?.[0]}
      error={fields.identifier.errors?.[0]}
      loading={navigation.formAction === "/oauth/login"}
    />
  );
};
