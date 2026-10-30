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
    <div className="card w-full border border-base-300 bg-base-100">
      <div className="card-body items-center text-center">
        <ErrorIcon status={status} />
        <h2 className="card-title text-2xl">{title}</h2>
        <p className="text-sm text-base-content/70">{details}</p>
        {stack && (
          <div className="relative w-full text-left">
            <pre className="overflow-x-auto rounded-box bg-base-200 p-4 text-xs">
              <code>{stack}</code>
            </pre>
            <button
              type="button"
              className="btn absolute top-2 right-2 btn-square btn-ghost btn-sm"
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
        <div className="mt-2 card-actions">
          <a href="/" className="btn btn-primary">
            <HomeIcon className="size-4" />
            ホームに戻る
          </a>
        </div>
        {status && <p className="text-xs text-base-content/50">{status}</p>}
      </div>
    </div>
  );
}
