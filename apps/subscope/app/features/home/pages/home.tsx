import { Link } from "react-router";

import { AppLayout } from "@/app/components/layout";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";

export function HomePage() {
  return (
    <AppLayout>
      <div className="flex w-full flex-col gap-6 py-8 [word-break:auto-phrase]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Subscope</h1>
            <Badge variant="secondary">Alpha</Badge>
          </div>
          <p className="text-muted-foreground">
            誰でもセルフホストできるBluesky互換Appview
          </p>
        </div>

        <Separator />

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
              <CardTitle>使い方</CardTitle>
              <CardDescription>
                下のボタンからログインして案内に従ってください。
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            nativeButton={false}
            render={<Link to="/login">ログイン</Link>}
          />
          <p className="text-center text-sm text-muted-foreground">
            注意：AT Protocolについてある程度分かっている人向けです
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
