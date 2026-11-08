import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Skeleton } from "@/app/components/ui/skeleton";

type Operator = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  operator?: Operator;
  serviceDid?: string;
};

export function ServerInfo({ operator, serviceDid }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <h1 className="p-4 pb-2 text-title">サーバーについて</h1>
      <div className="space-y-4 px-4 pb-4 text-label">
        <p>
          SubscopeはBlueskyでフォローしている人の投稿だけが流れる分散SNSです。
        </p>
        <section className="space-y-1">
          <h2 className="text-heading">仕組み</h2>
          <p>
            Subscopeにログインするとあなたのアカウントが登録され、アカウントの情報を読み込みます。このとき、あなたがフォローしている全てのアカウントの情報も読み込みます。これにより、サーバーに登録した人と、その誰かがフォローした人の投稿が表示されます。
          </p>
        </section>
        <section className="space-y-1">
          <h2 className="text-heading">Subscopeが目指すもの</h2>
          <p>
            これまで、Blueskyと連携する分散SNSを作るには、Blueskyと同等に強力なサーバーが必要でした。Subscopeは上の仕組みでサーバーに保存するデータを大幅に減らし、誰でも個人でBlueskyの仕組みを使った分散SNSを運営できることを目指しています。
          </p>
        </section>
      </div>
      <dl className="border-t border-line text-label">
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <dt className="w-20 shrink-0 text-muted">運営者</dt>
          <dd className="flex min-w-0 flex-wrap gap-x-3">
            {!serviceDid && (
              <span role="status" aria-label="運営者を読み込み中">
                <Skeleton className="h-4 w-24" />
              </span>
            )}
            {operator && (
              <Link
                to={`/${operator.handle === "handle.invalid" ? operator.did : operator.handle}`}
                className="
                  flex min-w-0 items-center gap-2 text-brand
                  hover:underline
                "
              >
                <Avatar src={operator.avatarUrl} size="sm" />
                <span className="truncate">
                  {operator.displayName || operator.handle}
                </span>
              </Link>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <dt className="w-20 shrink-0 text-muted">サーバーDID</dt>
          <dd className="min-w-0 flex-1">
            <button
              type="button"
              aria-label="サーバーDIDをコピー"
              disabled={!serviceDid}
              className="
                flex w-full min-w-0 items-center gap-1 rounded-md py-1 text-left
                hover:bg-surface-2
              "
              onClick={() =>
                void navigator.clipboard
                  .writeText(serviceDid ?? "")
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  })
              }
            >
              {serviceDid ? (
                <code className="min-w-0 truncate">{serviceDid}</code>
              ) : (
                <span role="status" aria-label="サーバーDIDを読み込み中">
                  <Skeleton className="h-4 w-56 max-w-full" />
                </span>
              )}
              {copied ? (
                <CheckIcon className="size-4 shrink-0 text-muted" />
              ) : (
                <CopyIcon className="size-4 shrink-0 text-muted" />
              )}
            </button>
          </dd>
        </div>
      </dl>
    </>
  );
}
