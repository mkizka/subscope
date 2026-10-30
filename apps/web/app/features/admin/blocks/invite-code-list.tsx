import { CheckIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { ConfirmDialog } from "@/app/features/admin/parts/confirm-dialog";
import { StatusBadge } from "@/app/features/admin/parts/status-badge";
import { formatDate } from "@/app/lib/format-date";

export type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: { did: string; handle?: string };
};

type RowsProps = {
  codes: InviteCode[];
  onDeleteCode: (code: string) => void;
  deletingCode: string | null;
};

type Props = RowsProps & {
  onCreateCode: () => void;
  isCreating: boolean;
  children?: ReactNode;
};

function isDeletable(code: InviteCode) {
  return !code.usedAt;
}

function isExpired(code: InviteCode) {
  return new Date(code.expiresAt) < new Date();
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-square btn-ghost btn-xs"
      aria-label="コピー"
      onClick={() =>
        void navigator.clipboard.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
      }
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </button>
  );
}

export function InviteCodeItems({
  codes,
  onDeleteCode,
  deletingCode,
}: RowsProps) {
  return codes.map((code) => (
    <li key={code.code} className="list-row items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-mono">{code.code}</span>
          {!code.usedAt && !isExpired(code) && <CopyButton code={code.code} />}
        </div>
        <div className="text-sm text-base-content/60">
          {code.usedBy && `${code.usedBy.handle ?? code.usedBy.did} が使用・`}
          {formatDate(code.expiresAt)} まで有効・{formatDate(code.createdAt)}{" "}
          作成
        </div>
      </div>
      <StatusBadge usedAt={code.usedAt} expiresAt={code.expiresAt} />
      {isDeletable(code) ? (
        <ConfirmDialog
          title={`${code.code} を削除しますか？`}
          description="このコードでは登録できなくなります。"
          confirmLabel="削除する"
          danger
          onConfirm={() => onDeleteCode(code.code)}
        >
          {(open) => (
            <button
              type="button"
              className="btn btn-square btn-ghost btn-sm"
              aria-label="削除"
              onClick={() =>
                isExpired(code) ? onDeleteCode(code.code) : open()
              }
              disabled={deletingCode === code.code}
            >
              {deletingCode === code.code ? (
                <span className="loading loading-sm loading-spinner" />
              ) : (
                <Trash2Icon className="size-4 text-error" />
              )}
            </button>
          )}
        </ConfirmDialog>
      ) : (
        <span className="size-8" />
      )}
    </li>
  ));
}

export function InviteCodeList({
  codes,
  onCreateCode,
  isCreating,
  onDeleteCode,
  deletingCode,
  children,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">招待コード</h1>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onCreateCode}
          disabled={isCreating}
        >
          {isCreating ? "作成中..." : "新規作成"}
        </button>
      </div>
      <ul className="list" aria-label="招待コード">
        {codes.length === 0 ? (
          <li className="py-8 text-center">招待コードはまだありません</li>
        ) : (
          <InviteCodeItems
            codes={codes}
            onDeleteCode={onDeleteCode}
            deletingCode={deletingCode}
          />
        )}
        {children}
      </ul>
    </div>
  );
}
