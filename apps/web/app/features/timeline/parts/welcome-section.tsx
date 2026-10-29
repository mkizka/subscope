import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

type Props = {
  atprotoProxy: string;
};

export function WelcomeSection({ atprotoProxy }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(atprotoProxy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex flex-col gap-4 px-4 py-3">
      <h1 className="text-xl font-bold">登録が完了しました</h1>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">使い方</h2>
        <p className="text-base-content/70">
          以下の文字列をコピーして、お使いのBlueskyクライアントのAppView設定に貼り付けてください。
        </p>
        <div className="flex items-center gap-2">
          <code
            className="
              min-w-0 flex-1 overflow-x-auto rounded-box bg-base-200 px-3 py-2
              text-nowrap
            "
          >
            {atprotoProxy}
          </code>
          <button
            type="button"
            className="btn btn-square btn-outline"
            onClick={handleCopy}
            aria-label="コピー"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </button>
        </div>
        <p className="text-base-content/70">
          しばらく待つとタイムラインが見えるようになります。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">
          <a
            href="https://tokimeki.blue/"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-1 underline underline-offset-4"
          >
            TOKIMEKI
          </a>
          の場合
        </h3>
        <p className="text-base-content/70">
          ワークスペースとアカウント
          <span className="mx-1">{`>`}</span>
          ワークスペースの[…]
          <span className="mx-1">{`>`}</span>
          AppViewプロキシを変更
          <span className="mx-1"></span>
          から設定できます。
        </p>
      </div>
      <div className="divider my-0" />
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">タイムラインのデモ</h2>
        <p className="text-base-content/70">
          お試しとしてSubscopeを使ってタイムラインを表示しています。いいね数などが違って表示されているはず。
        </p>
      </div>
    </section>
  );
}
