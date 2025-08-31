import type { XRPCError } from "@atproto/xrpc";
import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { SubscoBrowserAgent } from "@repo/client/api";
import { useMemo } from "react";
import { redirect } from "react-router";
import useSWRInfinite from "swr/infinite";

import { HeaderCard } from "~/components/header-card";
import { InfiniteScroll } from "~/components/infinite-scroll";
import { oauthSession } from "~/server/inject";

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

type XRPCResponse = MeSubscoAdminGetInviteCodes.OutputSchema;
type InviteCode = MeSubscoAdminGetInviteCodes.InviteCode;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

function InviteCodesRow({ inviteCodes }: { inviteCodes: InviteCode[] | null }) {
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

const getKey = (pageIndex: number, previousPageData: XRPCResponse | null) => {
  if (previousPageData && !previousPageData.cursor) return null;
  if (pageIndex === 0) return ["invite-codes", null];
  return ["invite-codes", previousPageData?.cursor ?? null];
};

const fetcher = async ([, cursor]: [string, string | null]) => {
  const agent = new SubscoBrowserAgent();
  const response = await agent.me.subsco.admin.getInviteCodes({
    limit: 5,
    cursor: cursor ?? undefined,
  });
  return response.data;
};

export default function Page() {
  const { data, error, isValidating, isLoading, setSize, mutate } =
    useSWRInfinite<XRPCResponse, XRPCError>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  const inviteCodes = useMemo(() => {
    if (!data) return null;
    return data.flatMap((page) => page.codes);
  }, [data]);

  // 初期描画時からspinnerを出しておきたいので、初回読み込み(isLoading=true)の時もtrueにする
  const hasMore = Boolean(data?.at(-1)?.cursor) || isLoading;
  const loadMore = () => setSize((size) => size + 1);
  const reload = () => mutate();

  return (
    <div className="grid gap-2">
      <HeaderCard />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row justify-center">
          <button className="btn btn-primary w-fit">
            <span className="icon-[tabler--circle-plus] size-5"></span>
            招待コードを新規作成
          </button>
          <button className="btn btn-secondary w-fit" onClick={reload}>
            <span className="icon-[tabler--refresh] size-5"></span>
            一覧を更新
          </button>
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm overflow-hidden p-0">
        <div className="card-body">
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
            <InfiniteScroll
              onIntersect={loadMore}
              hasMore={hasMore}
              isLoading={isValidating}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
