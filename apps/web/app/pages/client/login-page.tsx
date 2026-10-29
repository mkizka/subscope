import { Link } from "react-router";

import { AppLayout } from "@/app/components/app-layout";
import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

export function LoginPage() {
  return (
    <AppLayout verticalCenter>
      <div className="flex flex-col gap-4">
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">atprotoでログイン</h2>
            <LoginFormContainer />
          </div>
        </div>
        <p className="text-center text-sm text-base-content/70">
          はじめて利用する場合は
          <Link to="/register" className="link">
            アカウントを登録してください
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}
