import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { useState } from "react";

import { HeaderCard } from "~/components/header-card";
import { InfiniteScroll } from "~/components/infinite-scroll";
import { CreatedInviteCodeModal } from "~/features/invite-code/modal";
import { cn } from "~/utils/cn";

type InviteCode = MeSubscoAdminGetInviteCodes.InviteCode;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

function CopyButton({ code }: { code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert("クリップボードへのコピーに失敗しました");
    }
  };

  return (
    <button
      className={cn("btn w-40", isCopied ? "btn-success" : "font-mono")}
      onClick={handleCopy}
      title="クリックしてコピー"
    >
      {isCopied ? (
        <span className="inline-flex items-center gap-1 animate-in fade-in">
          <span className="icon-[tabler--check] size-4" />
          コピーしました
        </span>
      ) : (
        <span className="truncate">{code}</span>
      )}
    </button>
  );
}

function UsedBy({ handleOrDid: handleOdDid }: { handleOrDid?: string }) {
  if (!handleOdDid) return "-";
  return (
    <a
      href={`https://bsky.app/profile/${handleOdDid}`}
      target="_blank"
      rel="noopener noreferrer"
      className="link link-primary"
    >
      {handleOdDid}
    </a>
  );
}

function InviteCodesRow({ inviteCodes }: { inviteCodes?: InviteCode[] }) {
  if (!inviteCodes) return null;

  if (inviteCodes.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="text-center pt-8">
          招待コードがありません
        </td>
      </tr>
    );
  }

  return inviteCodes.map((inviteCode) => (
    <tr key={inviteCode.code}>
      <th>
        <CopyButton code={inviteCode.code} />
      </th>
      <td>{formatDate(inviteCode.createdAt)}</td>
      <td>{formatDate(inviteCode.expiresAt)}</td>
      <td>
        <UsedBy
          handleOrDid={inviteCode.usedBy?.handle ?? inviteCode.usedBy?.did}
        />
      </td>
      <td>{inviteCode.usedAt ? formatDate(inviteCode.usedAt) : "-"}</td>
    </tr>
  ));
}

function ErrorMessageRow({ reload }: { reload: () => void }) {
  return (
    <tr>
      <td colSpan={5} className="text-center pt-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-error">データの読み込みに失敗しました</p>
          <button className="btn btn-secondary btn-sm" onClick={reload}>
            再試行
          </button>
        </div>
      </td>
    </tr>
  );
}

type InviteCodePresenterProps = {
  inviteCodes?: InviteCode[];
  error: Error | null;
  createInviteCode: () => void;
  isCreatingInviteCode: boolean;
  createdInviteCode?: string;
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  reload: () => void;
  loadMore: () => void;
  hasMore: boolean;
  isFetching: boolean;
  isRefetching: boolean;
};

export function InviteCodePresenter({
  inviteCodes,
  error,
  createInviteCode,
  isCreatingInviteCode,
  createdInviteCode,
  isModalOpen,
  setIsModalOpen,
  reload,
  loadMore,
  hasMore,
  isFetching,
  isRefetching,
}: InviteCodePresenterProps) {
  return (
    <>
      <div className="grid gap-2">
        <HeaderCard showBackButton>招待コード</HeaderCard>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body flex-row justify-center">
            <button
              className="btn btn-primary w-fit"
              onClick={createInviteCode}
              disabled={isCreatingInviteCode}
            >
              <span
                className={cn("size-5", {
                  "icon-[tabler--circle-plus]": !isCreatingInviteCode,
                  "icon-[tabler--loader-2] animate-spin": isCreatingInviteCode,
                })}
              ></span>
              招待コード作成
            </button>
            <button
              className="btn btn-secondary w-fit"
              onClick={reload}
              disabled={isRefetching}
            >
              <span
                className={cn("size-5", {
                  "icon-[tabler--refresh]": !isRefetching,
                  "icon-[tabler--loader-2] animate-spin": isRefetching,
                })}
              ></span>
              一覧を更新
            </button>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm overflow-hidden p-0">
          <div className="card-body overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="table whitespace-nowrap">
                <thead>
                  <tr>
                    <th>招待コード</th>
                    <th>作成日</th>
                    <th>期限日</th>
                    <th>使用者</th>
                    <th>使用日</th>
                  </tr>
                </thead>
                <tbody>
                  {error ? (
                    <ErrorMessageRow reload={reload} />
                  ) : (
                    <InviteCodesRow inviteCodes={inviteCodes} />
                  )}
                </tbody>
              </table>
            </div>
            <InfiniteScroll
              className="mt-8 mb-4"
              onIntersect={loadMore}
              hasMore={hasMore}
              isLoading={isFetching}
            />
          </div>
        </div>
      </div>
      {createdInviteCode && (
        <CreatedInviteCodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          inviteCode={createdInviteCode}
        />
      )}
    </>
  );
}
