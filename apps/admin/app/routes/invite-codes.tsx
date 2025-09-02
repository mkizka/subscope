import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { SubscoBrowserAgent } from "@repo/client/api";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { redirect } from "react-router";

import { HeaderCard } from "~/components/header-card";
import { InfiniteScroll } from "~/components/infinite-scroll";
import { oauthSession } from "~/server/inject";
import { cn } from "~/utils/cn";

import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await oauthSession.getAgent(request);

  if (!agent) {
    return redirect("/login");
  }

  return {
    userDid: agent.did,
  };
}

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

const fetchInviteCodes = async ({
  pageParam,
}: {
  pageParam: string | undefined;
}) => {
  const agent = new SubscoBrowserAgent();
  const response = await agent.me.subsco.admin.getInviteCodes({
    limit: 5,
    cursor: pageParam,
  });
  return response.data;
};

export default function Page() {
  const {
    data: inviteCodes,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isPending,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["invite-codes"],
    queryFn: fetchInviteCodes,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => data.pages.flatMap((page) => page.codes),
    initialPageParam: undefined,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const agent = new SubscoBrowserAgent();
      const response = await agent.me.subsco.admin.createInviteCode({
        daysToExpire: 30,
      });
      return response.data;
    },
    onSuccess: () => refetch(),
  });

  // 初期描画時からspinnerを出しておきたいので、初回読み込み(isPending=true)の時もtrueにする
  const hasMore = isPending || hasNextPage;
  const loadMore = () => fetchNextPage();
  const reload = () => refetch();

  return (
    <div className="grid gap-2">
      <HeaderCard />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row justify-center">
          <button
            className="btn btn-primary w-fit"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <span
              className={cn("size-5", {
                "icon-[tabler--circle-plus]": !mutation.isPending,
                "icon-[tabler--loader-2] animate-spin": mutation.isPending,
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
  );
}
