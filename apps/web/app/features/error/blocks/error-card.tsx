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
      <div className="card-body">
        <div className="flex items-center gap-3">
          <ErrorIcon status={status} />
          <h2 className="card-title text-2xl">{title}</h2>
        </div>
        <p className="text-sm text-base-content/70">
          {details}
          {status && `（ステータス：${status}）`}
        </p>
        {stack && (
          <div className="relative">
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
        <div className="card-actions justify-end">
          <a href="/" className="btn btn-outline">
            <HomeIcon className="size-4" />
            ホームに戻る
          </a>
        </div>
      </div>
    </div>
  );
}
