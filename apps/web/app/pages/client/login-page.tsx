import { InviteCodeFormContainer } from "@/app/features/login/blocks/invite-code-form-container";
import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

type Props = {
  step: "setup" | "login" | "inviteCode";
};

export function LoginPage({ step }: Props) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="card w-full max-w-sm border border-base-300 bg-base-100">
        <div className="card-body">
          <img src="/favicon.svg" alt="" className="size-10" />
          <h1 className="card-title">Subscope</h1>
          <p className="text-base-content/70">
            招待制のBluesky互換サーバーです。Blueskyのアカウントでログインします。
          </p>
          {step === "setup" && (
            <p>最初にログインしたアカウントがこのサーバーの管理者になります</p>
          )}
          {step === "inviteCode" && (
            <>
              <ul aria-label="手順" className="steps text-sm">
                <li className="step step-primary">ログイン</li>
                <li aria-current="step" className="step step-primary">
                  招待コード
                </li>
              </ul>
              <p>このサーバーを使うには招待コードを入力してください</p>
            </>
          )}
          {step === "inviteCode" ? (
            <InviteCodeFormContainer />
          ) : (
            <LoginFormContainer />
          )}
        </div>
      </div>
    </main>
  );
}
