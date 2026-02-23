import { Link } from "react-router";

import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export function HomeContent() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>これはなに</CardTitle>
            <CardDescription>
              Bluesky互換のAppview実装です。
              フォロータイムラインを見れるくらいの最小限のXRPCが実装されています。
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>コンセプト</CardTitle>
            <CardDescription>
              <a
                href="https://docs.bsky.app/blog/introducing-tap"
                className="underline underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                Tap
              </a>
              を利用して、あなたとあなたがフォローしている人のレコードだけを収集する省ストレージなAppviewです。
            </CardDescription>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>始め方</CardTitle>
            <CardDescription>
              下のボタンからatprotoアカウントを登録、またはログインできます。アカウント登録には招待コードが必要です。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Button
            nativeButton={false}
            render={<Link to="/register">アカウント登録</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/login">ログイン</Link>}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          注意：AT Protocolについてある程度分かっている人向けです
        </p>
      </div>
    </>
  );
}
