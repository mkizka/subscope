import { CheckCircle2Icon } from "lucide-react";
import type { ComponentProps } from "react";
import { useRef } from "react";
import { Form } from "react-router";

import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

type Props = {
  isLoggedIn: boolean;
  activeSubmit?: boolean;
  formProps: ComponentProps<typeof Form>;
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
  const loginDialogRef = useRef<HTMLDialogElement>(null);
  const error = (formErrors ?? fields.inviteCode.errors)?.[0];

  return (
    <div className="card w-full border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <h1 className="card-title">アカウント登録</h1>
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">1. atprotoアカウントでログイン</h2>
          <div className="pl-4">
            {isLoggedIn ? (
              <button type="button" className="btn btn-outline">
                <CheckCircle2Icon className="size-4 text-success" />
                ログイン済み
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => loginDialogRef.current?.showModal()}
                >
                  ログイン
                </button>
                <dialog ref={loginDialogRef} className="modal">
                  <div className="modal-box">
                    <LoginFormContainer />
                  </div>
                  <form method="dialog" className="modal-backdrop">
                    <button>閉じる</button>
                  </form>
                </dialog>
              </>
            )}
          </div>
        </div>
        <Form method="post" className="flex flex-col gap-4" {...formProps}>
          <div className="flex flex-col gap-2">
            <h2 className="font-medium">2. 招待コードを入力</h2>
            <div className="flex flex-col gap-2 pl-4">
              <input
                className="input w-full"
                disabled={!isLoggedIn}
                placeholder="subsco-me-abcde"
                {...inputProps}
              />
              {error && (
                <p role="alert" className="text-sm text-error">
                  {error}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="btn self-center btn-primary"
            disabled={!activeSubmit}
          >
            登録する
          </button>
        </Form>
      </div>
    </div>
  );
}
