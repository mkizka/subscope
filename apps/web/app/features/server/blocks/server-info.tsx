import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

type Operator = { did: string; handle: string; displayName?: string };

type Props = {
  operators?: Operator[];
  serviceDid?: string;
};

export function ServerInfo({ operators, serviceDid }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <h1 className="p-4 pb-2 text-title">サーバー</h1>
      <p className="px-4 pb-4 text-label">
        Subscopeは誰かがフォローしている人の投稿だけが流れる招待制サーバーです。Blueskyへの投稿の一部が表示されていますが、Blueskyではありません。
      </p>
      <dl className="border-t border-line text-label">
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <dt className="w-20 shrink-0 text-muted">運営者</dt>
          <dd className="flex min-w-0 flex-wrap gap-x-3">
            {operators?.map((operator) => (
              <Link
                key={operator.did}
                to={`/${operator.handle === "handle.invalid" ? operator.did : operator.handle}`}
                className="
                  truncate text-brand
                  hover:underline
                "
              >
                {operator.displayName || operator.handle}
              </Link>
            ))}
          </dd>
        </div>
        <div className="flex items-center gap-4 border-b border-line px-4 py-3">
          <dt className="w-20 shrink-0 text-muted">サーバーDID</dt>
          <dd className="flex min-w-0 flex-1 items-center gap-1">
            <code className="min-w-0 truncate">{serviceDid}</code>
            <button
              type="button"
              aria-label="コピー"
              disabled={!serviceDid}
              className="
                shrink-0 rounded-md p-1 text-muted
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
              {copied ? (
                <CheckIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
            </button>
          </dd>
        </div>
      </dl>
    </>
  );
}
