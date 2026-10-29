import { XIcon } from "lucide-react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
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

type Props = {
  codes: InviteCode[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  onCreateCode: () => void;
  isCreating: boolean;
  onDeleteCode: (code: string) => void;
  deletingCode: string | null;
};

function isDeletable(code: InviteCode) {
  return !code.usedAt;
}

function isExpired(code: InviteCode) {
  return new Date(code.expiresAt) < new Date();
}

export function InviteCodeTable({
  codes,
  isLoading,
  isFetchingNextPage,
  onLoadMore,
  hasNextPage,
  onCreateCode,
  isCreating,
  onDeleteCode,
  deletingCode,
}: Props) {
  return (
    <>
      <div className="card border border-base-300 bg-base-100">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="card-title text-2xl">招待コード一覧</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreateCode}
            disabled={isCreating}
          >
            {isCreating ? "作成中..." : "新規作成"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>コード</th>
                <th>ステータス</th>
                <th>使用者</th>
                <th>有効期限</th>
                <th>作成日</th>
                <th>削除</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    招待コードはまだありません
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    読み込み中...
                  </td>
                </tr>
              )}
              {codes.map((code) => (
                <tr key={code.code}>
                  <td className="font-mono">{code.code}</td>
                  <td>
                    <StatusBadge
                      usedAt={code.usedAt}
                      expiresAt={code.expiresAt}
                    />
                  </td>
                  <td>{code.usedBy?.handle ?? code.usedBy?.did ?? "-"}</td>
                  <td>{formatDate(code.expiresAt)}</td>
                  <td>{formatDate(code.createdAt)}</td>
                  <td>
                    {isDeletable(code) && (
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
                          <XIcon className="size-4 text-error" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isFetchingNextPage && (
        <p className="mt-4 text-center text-sm text-base-content/70">
          読み込み中...
        </p>
      )}
      {onLoadMore && (
        <InfiniteScrollTrigger
          onIntersect={onLoadMore}
          enabled={hasNextPage && !isFetchingNextPage}
        />
      )}
    </>
  );
}
