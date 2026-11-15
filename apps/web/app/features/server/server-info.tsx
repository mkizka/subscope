import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";

import { AboutDialog } from "./about-dialog";

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

const hostname = (serviceDid: string) =>
  serviceDid.replace(/^did:web:/, "").replace(/#.*$/, "");

export function ServerInfo({ operator, serviceDid }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            className="size-16 rounded-2xl border border-line"
          />
          <AboutDialog>
            {(open) => (
              <Button variant="secondary" size="sm" onClick={open}>
                Subscopeとは
              </Button>
            )}
          </AboutDialog>
        </div>
        <div>
          <h1 className="text-title">
            {serviceDid ? (
              hostname(serviceDid)
            ) : (
              <Skeleton className="h-6 w-40" />
            )}
          </h1>
          <p className="text-label text-muted">Subscopeのサーバー</p>
        </div>
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
