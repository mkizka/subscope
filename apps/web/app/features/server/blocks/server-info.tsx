import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";

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
      <p className="px-4 pb-4 text-label">
        Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです
      </p>
      <dl className="border-t border-line text-label">
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <dt className="w-20 shrink-0 text-muted">運営者</dt>
          <dd className="flex min-w-0 flex-wrap gap-x-3">
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
              <code className="min-w-0 truncate">{serviceDid}</code>
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
