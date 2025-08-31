import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { SubscoBrowserAgent } from "@repo/client/api";
import { useCallback, useState } from "react";
import { redirect } from "react-router";

import { HeaderCard } from "~/components/HeaderCard";
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

type InviteCode = MeSubscoAdminGetInviteCodes.InviteCode;

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

function TableRow({ inviteCodes }: { inviteCodes: InviteCode[] | null }) {
  if (!inviteCodes) return null;

  if (inviteCodes.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="text-center">
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

export default function Page() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadInviteCodes = useCallback(async (nextCursor: string | null) => {
    const agent = new SubscoBrowserAgent(location.href);
    setIsLoading(true);
    try {
      const response = await agent.me.subsco.admin.getInviteCodes({
        limit: 5,
        cursor: nextCursor || undefined,
      });
      setInviteCodes((prev) => [...(prev ?? []), ...response.data.codes]);
      setCursor(response.data.cursor ?? null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadInviteCodes = useCallback(async () => {
    setInviteCodes(null);
    await loadInviteCodes(null);
  }, [loadInviteCodes]);

  return (
    <div className="grid gap-2">
      <HeaderCard />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row justify-center">
          <button className="btn btn-primary w-fit">
            <span className="icon-[tabler--circle-plus] size-5"></span>
            招待コードを新規作成
          </button>
          <button
            className="btn btn-secondary w-fit"
            onClick={reloadInviteCodes}
          >
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
                <TableRow inviteCodes={inviteCodes} />
              </tbody>
            </table>
            <InfiniteScroll
              onIntersect={() => loadInviteCodes(cursor)}
              hasMore={inviteCodes === null || cursor !== null}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
