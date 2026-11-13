import type { ComponentProps } from "react";
import { Form } from "react-router";

import { Button, buttonClass } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  inviteCodeInputProps?: ComponentProps<"input">;
  inviteCodeError?: string;
  error?: string;
  loading: boolean;
};

export function LoginForm({
  formProps,
  inputProps,
  inviteCodeInputProps,
  inviteCodeError,
  error,
  loading,
}: Props) {
  return (
    <Form
      action="/oauth/login"
      method="POST"
      className="flex flex-col gap-4"
      {...formProps}
    >
      <Input
        label="ハンドル"
        placeholder="example.bsky.social"
        autoComplete="username"
        error={error}
        {...inputProps}
      />
      {inviteCodeInputProps && (
        <Input
          label="招待コード"
          placeholder="subsco-me-abcde"
          error={inviteCodeError}
          {...inviteCodeInputProps}
        />
      )}
      <Button type="submit" loading={loading}>
        {inviteCodeInputProps ? "新規登録" : "ログイン"}
      </Button>
      {!inviteCodeInputProps && (
        <a
          href="/login/atpassport"
          className={buttonClass({ variant: "secondary" })}
        >
          @passportでログイン
        </a>
      )}
    </Form>
  );
}
