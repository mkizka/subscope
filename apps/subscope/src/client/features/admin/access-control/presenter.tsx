import { AlertCircle, Loader2, ShieldAlert, UserPlus } from "lucide-preact";

import { Button, ButtonLink } from "../../../components/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/card.js";

type AccessStatus = "needsSetup" | "authorized" | "unauthorized";

type AccessControlPresenterProps = {
  isLoading?: boolean;
  error?: { message: string } | null;
  status?: AccessStatus;
  isRegistering?: boolean;
  onRegister?: () => void;
  children?: preact.ComponentChildren;
};

export function AccessControlPresenter({
  isLoading,
  error,
  status,
  isRegistering,
  onRegister,
  children,
}: AccessControlPresenterProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-sm text-on-surface-variant">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-error" />
              <CardTitle>エラーが発生しました</CardTitle>
            </div>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ButtonLink href="/" variant="outline" className="w-full">
              ホームに戻る
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status === "needsSetup") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-primary" />
              <CardTitle>初期セットアップ</CardTitle>
            </div>
            <CardDescription>
              まだ管理者が登録されていません。現在ログイン中のアカウントを管理者として登録します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onRegister}
              disabled={isRegistering}
              className="w-full"
            >
              {isRegistering ? "登録中..." : "管理者として登録"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-error" />
              <CardTitle>アクセス権限がありません</CardTitle>
            </div>
            <CardDescription>
              管理画面にアクセスする権限がありません。管理者アカウントでログインしてください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ButtonLink href="/login" variant="outline" className="w-full">
              ログインページへ
            </ButtonLink>
            <ButtonLink href="/" variant="ghost" className="w-full">
              ホームに戻る
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
