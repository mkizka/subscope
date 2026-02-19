import { CheckCircle2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { LoginFormContainer } from "@/app/features/login/parts/login-form-container";
import { InviteCodeForm } from "@/app/features/register/parts/invite-code-form";

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

export function RegisterCard({
  isLoggedIn,
  activeSubmit,
  formProps,
  inputProps,
  fields,
  error,
}: Props) {
  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle className="text-2xl">アカウント登録</CardTitle>
        <CardDescription>
          Subscopeを利用するにはアカウントをサーバーに登録する必要があります。
          すでに登録済みの方は
          <Link
            to="/login"
            className="
              underline underline-offset-4
              hover:text-foreground
            "
          >
            ログイン
          </Link>
          へ
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm font-medium">
          1. BlueskyまたはセルフホストPDSのアカウントでログイン
        </p>
        <div className="pl-4">
          {isLoggedIn ? (
            <Button variant="outline" className="w-fit">
              <CheckCircle2Icon className="size-4 text-green-600" />
              ログイン済み
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger
                render={<Button className="w-fit">ログイン</Button>}
              />
              <DialogContent>
                <LoginFormContainer />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <InviteCodeForm
          isLoggedIn={isLoggedIn}
          activeSubmit={activeSubmit}
          formProps={formProps}
          inputProps={inputProps}
          fields={fields}
          error={error}
        />
      </CardContent>
    </Card>
  );
}
