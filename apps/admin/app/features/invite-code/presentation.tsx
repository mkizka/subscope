import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";

import { HeaderCard } from "~/components/header-card";
import { InfiniteScroll } from "~/components/infinite-scroll";
import { CreatedInviteCodeModal } from "~/features/invite-code/modal";
import { cn } from "~/utils/cn";

type InviteCode = MeSubscoAdminGetInviteCodes.InviteCode;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

function InviteCodesRow({ inviteCodes }: { inviteCodes?: InviteCode[] }) {
  if (!inviteCodes) return null;

  if (inviteCodes.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="text-center pt-8">
          招待コードがありません
        </td>
      </tr>
    );
  }

  return inviteCodes.map((code) => (
    <tr key={code.code}>
      <th className="font-mono">{code.code}</th>
      <td>{formatDate(code.createdAt)}</td>
      <td>{formatDate(code.expiresAt)}</td>
    </tr>
  ));
}

function ErrorMessageRow({ reload }: { reload: () => void }) {
  return (
    <tr>
      <td colSpan={3} className="text-center pt-8">
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

type InviteCodePresentationProps = {
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

export function InviteCodePresentation({
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
}: InviteCodePresentationProps) {
  return (
    <>
      <div className="grid gap-2">
        <HeaderCard />
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
