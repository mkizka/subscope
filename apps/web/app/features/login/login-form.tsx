import type { ComponentProps } from "react";
import { Form } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  error?: string;
  loading: boolean;
};

export function LoginForm({ formProps, inputProps, error, loading }: Props) {
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
      <Button type="submit" loading={loading}>
        ログイン
      </Button>
    </Form>
  );
}
