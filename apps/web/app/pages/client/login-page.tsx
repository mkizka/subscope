import { CheckIcon } from "lucide-react";

import { InviteCodeFormContainer } from "@/app/features/login/blocks/invite-code-form-container";
import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

type Props = {
  step: "setup" | "login" | "inviteCode";
};

export function LoginPage({ step }: Props) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div
        className="
          flex w-full max-w-sm flex-col gap-4 rounded-[14px] border border-line
          p-6
        "
      >
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="size-8" />
          <h1 className="text-xl font-bold">Subscope</h1>
        </div>
        <p className="text-sm text-muted">
          招待制のBluesky互換サーバーです。Blueskyのアカウントでログインします。
        </p>
        {step === "setup" && (
          <p>最初にログインしたアカウントがこのサーバーの管理者になります</p>
        )}
        {step === "inviteCode" && (
          <>
            <ol aria-label="手順" className="flex items-center gap-2 text-sm">
              <li className="flex flex-1 items-center gap-1 text-muted">
                <CheckIcon className="size-4 text-brand" />
                ログイン
                <span className="ml-1 h-px flex-1 bg-line" />
              </li>
              <li
                aria-current="step"
                className="rounded-full bg-brand-soft px-3 py-1 font-bold"
              >
                招待コード
              </li>
            </ol>
            <p>このサーバーを使うには招待コードを入力してください</p>
          </>
        )}
        {step === "inviteCode" ? (
          <InviteCodeFormContainer />
        ) : (
          <LoginFormContainer />
        )}
      </div>
    </main>
  );
}
