import { Link } from "react-router";

import { Button } from "@/app/components/ui/button";

export function HomeContent() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">これはなに</h2>
          <p className="text-muted-foreground">
            Bluesky互換のAppview実装です。フォロータイムラインを見られるくらいの最小限のXRPCが実装されています。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">コンセプト</h2>
          <p className="text-muted-foreground">
            <a
              href="https://docs.bsky.app/blog/introducing-tap"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Tap
            </a>
            を利用して、あなたとあなたがフォローしている人のレコードだけを収集することでストレージを節約します。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">始め方</h2>
          <p className="text-muted-foreground">
            以下のボタンからサーバーにアカウントを登録してください。
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Button
            nativeButton={false}
            render={<Link to="/register">アカウントを登録</Link>}
          />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/login">ログイン</Link>}
          />
        </div>
        <p className="text-center text-muted-foreground">
          注意：AT Protocolについてある程度分かっている人向けです
        </p>
      </div>
    </>
  );
}
