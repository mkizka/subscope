import { CheckIcon, CopyIcon, HomeIcon } from "lucide-react";
import { useState } from "react";

import { ErrorIcon } from "@/app/features/error/parts/error-icon";

type Props = {
  title: string;
  details: string;
  status?: number;
  stack?: string;
};

export function ErrorCard({ title, details, status, stack }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!stack) return;
    void navigator.clipboard.writeText(stack).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="
        flex w-full flex-col items-center gap-3 rounded-[14px] border
        border-line p-6 text-center
      "
    >
      <ErrorIcon status={status} />
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted">{details}</p>
      {stack && (
        <div className="relative w-full text-left">
          <pre
            className="overflow-x-auto rounded-[14px] bg-surface-2 p-4 text-xs"
          >
            <code>{stack}</code>
          </pre>
          <button
            type="button"
            className="
              absolute top-2 right-2 rounded-full p-2
              hover:bg-line
            "
            onClick={handleCopy}
            aria-label="スタックトレースをコピー"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </button>
        </div>
      )}
      <a
        href="/"
        className="
          mt-2 flex items-center gap-2 rounded-full bg-brand px-5 py-2.5
          font-bold text-on-brand
          hover:opacity-90
        "
      >
        <HomeIcon className="size-4" />
        ホームに戻る
      </a>
      {status && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
