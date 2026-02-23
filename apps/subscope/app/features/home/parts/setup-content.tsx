import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { LoginFormContainer } from "@/app/features/login/blocks/login-form-container";

export function SetupContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>セットアップ</CardTitle>
        <CardDescription>
          このサーバーにはまだ管理者が登録されていません。管理者にしたいatprotoアカウントでログインしてください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginFormContainer />
      </CardContent>
    </Card>
  );
}
