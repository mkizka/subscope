import { CheckIcon, ChevronRightIcon } from "lucide-react";

import { Tabs } from "@/app/components/ui/tabs";
import { InviteCodeFormContainer } from "@/app/features/login/invite-code-form-container";
import { LoginFormContainer } from "@/app/features/login/login-form-container";
import { AboutDialog } from "@/app/features/server/about-dialog";

type Props = {
  step: "setup" | "login" | "inviteCode";
  tab?: "login" | "register";
  inviteCodeError?: string;
};

export function LoginPage({ step, tab = "login", inviteCodeError }: Props) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div
        className="
          flex w-full max-w-sm flex-col gap-6
          lg:max-w-none lg:flex-row lg:justify-center lg:gap-12
        "
      >
        <section
          className="
            flex flex-col items-center justify-center gap-4 text-center
            lg:w-sm lg:items-start lg:text-left
          "
        >
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}favicon.svg`}
              alt=""
              className="size-8"
            />
            <h1 className="text-title">Subscope</h1>
          </div>
          <h2 className="text-heading">
            SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。
          </h2>
          <p className="text-label">
            招待制のBluesky互換サーバーです。Blueskyのアカウントでログインします。
          </p>
          <AboutDialog>
            {(open) => (
              <button
                type="button"
                className="
                  flex items-center gap-1 text-label text-brand
                  hover:underline
                "
                onClick={open}
              >
                詳しく見る
                <ChevronRightIcon className="size-4" />
              </button>
            )}
          </AboutDialog>
        </section>
        <div
          className="
            hidden w-px self-stretch bg-line
            lg:block
          "
        />
        <div
          className="
            flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line
            p-6
          "
        >
          {step === "login" && (
            <Tabs
              tabs={[
                { to: "/login", label: "ログイン", selected: tab === "login" },
                {
                  to: "/login?tab=register",
                  label: "新規登録",
                  selected: tab === "register",
                },
              ]}
            />
          )}
          {step === "login" && tab === "login" && (
            <p className="text-label text-muted">
              このサーバーに登録していないアカウントは、ログイン後に招待コードの入力が必要です
            </p>
          )}
          {step === "setup" && (
            <p>最初にログインしたアカウントがこのサーバーの管理者になります</p>
          )}
          {step === "inviteCode" && (
            <>
              <ol
                aria-label="手順"
                className="flex items-center gap-2 text-label"
              >
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
            <InviteCodeFormContainer error={inviteCodeError} />
          ) : (
            <LoginFormContainer
              withInviteCode={step === "login" && tab === "register"}
            />
          )}
        </div>
      </div>
    </main>
  );
}
