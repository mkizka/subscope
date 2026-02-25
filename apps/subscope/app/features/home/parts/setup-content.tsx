import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

export function SetupContent() {
  return (
    <div className="flex flex-col gap-4">
      <p>
        このサーバーにはまだ管理者が登録されていません。管理者にしたいatprotoアカウントでログインしてください。
      </p>
      <LoginFormContainer />
    </div>
  );
}
