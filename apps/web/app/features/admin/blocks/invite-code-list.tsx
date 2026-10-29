import { Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/app/features/admin/parts/status-badge";

export type InviteCode = {
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedBy?: { did: string; handle?: string };
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

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

export function InviteCodeItems({
  codes,
  onDeleteCode,
  deletingCode,
}: RowsProps) {
  return codes.map((code) => (
    <li key={code.code} className="list-row items-center">
      <div className="min-w-0">
        <div className="font-mono">{code.code}</div>
        <div className="text-sm text-base-content/60">
          {code.usedBy && `${code.usedBy.handle ?? code.usedBy.did} が使用・`}
          {formatDate(code.expiresAt)} まで有効・{formatDate(code.createdAt)}{" "}
          作成
        </div>
      </div>
      <StatusBadge usedAt={code.usedAt} expiresAt={code.expiresAt} />
      {isDeletable(code) ? (
        <button
          type="button"
          className="btn btn-square btn-ghost btn-sm"
          aria-label="削除"
          onClick={() => {
            if (
              isExpired(code) ||
              window.confirm(`${code.code} を削除しますか？`)
            ) {
              onDeleteCode(code.code);
            }
          }}
          disabled={deletingCode === code.code}
        >
          {deletingCode === code.code ? (
            <span className="loading loading-sm loading-spinner" />
          ) : (
            <Trash2Icon className="size-4 text-error" />
          )}
        </button>
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
