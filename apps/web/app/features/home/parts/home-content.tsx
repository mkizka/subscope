import { Link } from "react-router";

export function HomeContent() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">これはなに</h2>
          <p className="text-base-content/70">
            Bluesky互換のAppView実装です。フォロータイムラインを見られるくらいの最小限のXRPCが実装されています。
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">コンセプト</h2>
          <p className="text-base-content/70">
            <a
              href="https://docs.bsky.app/blog/introducing-tap"
              className="link"
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
          <p className="text-base-content/70">
            以下のボタンからサーバーにアカウントを登録してください。
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-3">
          <Link to="/register" className="btn btn-primary">
            アカウントを登録
          </Link>
          <Link to="/login" className="btn btn-outline">
            ログイン
          </Link>
        </div>
        <p className="text-center text-base-content/70">
          注意：AT Protocolについてある程度分かっている人向けです
        </p>
      </div>
    </>
  );
}
