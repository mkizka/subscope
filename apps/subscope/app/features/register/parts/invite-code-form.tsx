import type { ComponentProps } from "react";

import { Button } from "@/app/components/ui/button";
import { FieldError } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";

type Props = {
  isLoggedIn: boolean;
  activeSubmit?: boolean;
  formProps: ComponentProps<"form">;
  inputProps: ComponentProps<"input">;
  fields: {
    inviteCode: {
      id: string;
      errors?: string[];
    };
  };
  error?: string;
};

export function InviteCodeForm({
  isLoggedIn,
  activeSubmit,
  formProps,
  inputProps,
  fields,
  error,
}: Props) {
  return (
    <form method="POST" className="flex flex-col gap-4" {...formProps}>
      {error && (
        <div
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">2. 招待コードを入力</p>
        <div className="flex flex-col gap-2 pl-4">
          <Input
            disabled={!isLoggedIn}
            placeholder="subsco-me-abcde"
            {...inputProps}
          />
          <FieldError errors={fields.inviteCode.errors} />
        </div>
      </div>
      <div className="flex justify-center">
        <Button type="submit" className="w-fit" disabled={!activeSubmit}>
          登録する
        </Button>
      </div>
    </form>
  );
}
