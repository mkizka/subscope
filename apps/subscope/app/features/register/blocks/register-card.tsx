import { CheckCircle2Icon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { FieldError } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

type Props = {
  isLoggedIn: boolean;
  activeSubmit?: boolean;
  formProps: ComponentProps<"form">;
  formErrors?: string[];
  inputProps: ComponentProps<"input">;
  fields: {
    inviteCode: {
      id: string;
      errors?: string[];
    };
  };
};

export function RegisterCard({
  isLoggedIn,
  activeSubmit,
  formProps,
  formErrors,
  inputProps,
  fields,
}: Props) {
  return (
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle tag="h1">アカウント登録</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">1. atprotoアカウントでログイン</h2>
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
        </div>
        <form method="POST" className="flex flex-col gap-4" {...formProps}>
          <div className="flex flex-col gap-2">
            <h2 className="font-medium">2. 招待コードを入力</h2>
            <div className="flex flex-col gap-2 pl-4">
              <Input
                disabled={!isLoggedIn}
                placeholder="subsco-me-abcde"
                {...inputProps}
              />
              <FieldError errors={formErrors ?? fields.inviteCode.errors} />
            </div>
          </div>
          <div className="flex justify-center">
            <Button type="submit" className="w-fit" disabled={!activeSubmit}>
              登録する
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
