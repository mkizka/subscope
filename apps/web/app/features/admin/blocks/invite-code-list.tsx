import { CheckIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="コピー"
      onClick={() =>
        void navigator.clipboard.writeText(code).then(() => {
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
    </Button>
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
        <div className="flex items-center gap-2">
          <span className="font-mono">{code.code}</span>
          {!code.usedAt && !isExpired(code) && <CopyButton code={code.code} />}
        </div>
        {code.usedBy && (
          <div className="flex items-center gap-2 py-1 text-label">
            <Avatar src={code.usedBy.avatar} size="sm" />
            {code.usedBy.displayName ?? code.usedBy.handle} が使用
          </div>
        )}
        <div className="text-label text-muted">
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
            <Button
              type="button"
              variant="ghost"
              aria-label="削除"
              onClick={() =>
                isExpired(code) ? onDeleteCode(code.code) : open()
              }
              loading={deletingCode === code.code}
            >
              {deletingCode !== code.code && (
                <Trash2Icon className="size-4 text-danger" />
              )}
            </Button>
          )}
        </ConfirmDialog>
      ) : (
        <span className="size-10" />
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
          sticky top-0 flex items-center justify-between border-b border-line
          bg-surface px-4 py-3
        "
      >
        <h1 className="text-title">招待コード</h1>
        <Button type="button" onClick={onCreateCode} loading={isCreating}>
          新規作成
        </Button>
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
