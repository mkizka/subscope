import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/app/components/loading-spinner";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.tracked-accounts";

import { ActorList } from "./actor-list";

type TrackedAccountsResponse = Awaited<ReturnType<typeof loader>>["data"];

export function TrackedAccountsContainer() {
  const { data } = useQuery({
    queryKey: ["trackedAccounts"],
    queryFn: () => fetchJson<TrackedAccountsResponse>("/api/tracked-accounts"),
    throwOnError: true,
  });

  return (
    <>
      <div className="flex items-baseline gap-2 border-b border-line p-4">
        <h1 className="text-title">追跡アカウント</h1>
        {data && <span className="text-label text-muted">{data.total}人</span>}
      </div>
      <p
        className="
          border-b border-line bg-surface-2 px-4 py-2 text-label text-muted
        "
      >
        登録アカウントとそのフォロー先です。このサーバーはこの人たちの投稿だけを保存します。
      </p>
      {data ? (
        <ActorList actors={data.actors} />
      ) : (
        <LoadingSpinner label="読み込み中" />
      )}
    </>
  );
}
