import { Link } from "react-router";

import { AppLayout } from "@/app/components/layout";
import { LoginContainer } from "@/app/features/login/container";

export default function Login() {
  return (
    <AppLayout verticalCenter>
      <LoginContainer />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        アカウントを登録していない場合は
        <Link
          to="/register"
          className="
            underline underline-offset-4
            hover:text-foreground
          "
        >
          こちらから登録してください
        </Link>
      </p>
    </AppLayout>
  );
}
