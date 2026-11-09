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

export function InviteCodeForm({
  formProps,
  inputProps,
  error,
  loading,
}: Props) {
  return (
    <Form method="post" className="flex flex-col gap-4" {...formProps}>
      <Input
        label="招待コード"
        placeholder="subsco-me-abcde"
        error={error}
        {...inputProps}
      />
      <Button type="submit" loading={loading}>
        登録する
      </Button>
    </Form>
  );
}
