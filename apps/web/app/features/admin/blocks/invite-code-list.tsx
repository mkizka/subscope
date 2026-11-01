import {
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { StatusBadge } from "@/app/features/admin/parts/status-badge";
import { formatDate } from "@/app/lib/format-date";

export type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
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
      className="
        inline-flex size-6 items-center justify-center rounded-full
        hover:bg-surface-2
      "
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
    <li
      key={code.code}
      className="flex items-center gap-3 border-b border-line px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="font-mono">{code.code}</span>
          {!code.usedAt && !isExpired(code) && <CopyButton code={code.code} />}
        </div>
        <div className="text-label text-muted">
          {code.usedBy && (
            <>
              {code.usedBy.avatar ? (
                <img
                  src={code.usedBy.avatar}
                  alt=""
                  className="inline size-4 rounded-full align-text-bottom"
                />
              ) : (
                <span
                  className="
                    inline-block size-4 rounded-full bg-surface-2
                    align-text-bottom
                  "
                />
              )}{" "}
              {code.usedBy.displayName ?? code.usedBy.handle} が使用・
            </>
          )}
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
              className="
                inline-flex size-8 items-center justify-center rounded-full
                hover:bg-surface-2
                disabled:opacity-50
              "
              aria-label="削除"
              onClick={() =>
                isExpired(code) ? onDeleteCode(code.code) : open()
              }
              disabled={deletingCode === code.code}
            >
              {deletingCode === code.code ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4 text-danger" />
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
      <div
        className="
          flex items-center justify-between border-b border-line px-4 py-3
        "
      >
        <h1 className="text-title">招待コード</h1>
        <button
          type="button"
          className="
            rounded-full bg-brand px-4 py-1.5 text-label font-bold text-on-brand
            disabled:opacity-50
          "
          onClick={onCreateCode}
          disabled={isCreating}
        >
          {isCreating ? "作成中..." : "新規作成"}
        </button>
      </div>
      <ul aria-label="招待コード">
        {codes.length === 0 ? (
          <li className="py-8 text-center text-label text-muted">
            招待コードはまだありません
          </li>
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
