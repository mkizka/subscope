import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";

type Props = {
  registeredCount?: string;
  trackedCount?: number;
  serviceDid?: string;
};

const rowClass = `
  flex items-center justify-between border-t border-line px-4 py-3 text-label
  hover:bg-surface-2
`;

export function ServerInfo({
  registeredCount,
  trackedCount,
  serviceDid,
}: Props) {
  const helpRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  return (
    <>
      <h1 className="border-b border-line p-4 text-title">サーバー</h1>
      <section className="border-b border-line p-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-12" />
          <div>
            <h2 className="text-title">Subscope</h2>
            <div className="text-caption text-muted">招待制</div>
          </div>
        </div>
        <p className="mt-3 text-label">
          Blueskyのアカウントで使える招待制のサーバーです。登録アカウントとそのフォロー先の投稿だけを保存します。
        </p>
      </section>
      <section className="border-b border-line">
        <h2 className="px-4 pt-4 pb-1.5 text-caption text-muted">アカウント</h2>
        <Link to="/server/accounts" className={rowClass}>
          <span>登録アカウント</span>
          <span className="text-muted">{registeredCount ?? "-"} ›</span>
        </Link>
        <Link to="/server/accounts?tab=tracked" className={rowClass}>
          <span>追跡アカウント</span>
          <span className="text-muted">{trackedCount ?? "-"} ›</span>
        </Link>
        <button
          type="button"
          onClick={() => helpRef.current?.showModal()}
          className="
            flex items-center gap-1 px-4 py-2 text-caption text-brand
            hover:underline
          "
        >
          <InfoIcon className="size-4" aria-hidden />
          追跡アカウントとは？
        </button>
        <Dialog
          ref={helpRef}
          title="追跡アカウント"
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => helpRef.current?.close()}
            >
              閉じる
            </Button>
          }
        >
          <p>
            登録アカウントと、登録アカウント1人以上からフォローされているアカウントです。これらのアカウントの投稿がサーバーに保存されます。
          </p>
        </Dialog>
      </section>
      <section>
        <h2 className="px-4 pt-4 pb-1.5 text-caption text-muted">上級者向け</h2>
        <div className="mx-4 mb-4">
          <div className="mb-1 text-label">サーバーDID</div>
          <div
            className="
              flex items-center gap-2 rounded-xl border border-line bg-surface-2
              py-2 pr-2 pl-3
            "
          >
            <code className="min-w-0 flex-1 truncate text-caption">
              {serviceDid}
            </code>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!serviceDid}
              onClick={() =>
                void navigator.clipboard
                  .writeText(serviceDid ?? "")
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  })
              }
            >
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              コピー
            </Button>
          </div>
          <p className="mt-1 text-caption text-muted">
            この文字列をコピーして他のBlueskyクライアントで使用できます
          </p>
        </div>
      </section>
    </>
  );
}
