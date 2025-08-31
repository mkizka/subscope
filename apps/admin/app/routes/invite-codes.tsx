import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { SubscoBrowserAgent } from "@repo/client/api";
import { useEffect, useState } from "react";
import { redirect } from "react-router";

import { HeaderCard } from "~/components/HeaderCard";
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

export default function Page() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initializeInviteCodes = async () => {
    const agent = new SubscoBrowserAgent(location.href);
    setIsLoading(true);
    const response = await agent.me.subsco.admin.getInviteCodes();
    setInviteCodes(response.data.codes);
    setIsLoading(false);
  };

  useEffect(() => {
    void initializeInviteCodes();
  }, []);

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
            onClick={initializeInviteCodes}
          >
            <span className="icon-[tabler--refresh] size-5"></span>
            一覧を更新
          </button>
        </div>
      </div>
      <div className="card bg-base-100 shadow-sm overflow-hidden p-0">
        <div className="card-body">
          <div className="w-full overflow-x-auto">
            <table className="table whitespace-nowrap">
              <thead>
                <tr>
                  <th>招待コード</th>
                  <th>作成日</th>
                  <th>期限日</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center">
                      読み込み中...
                    </td>
                  </tr>
                ) : inviteCodes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center">
                      招待コードがありません
                    </td>
                  </tr>
                ) : (
                  inviteCodes.map((code) => (
                    <tr key={code.code}>
                      <th className="font-mono">{code.code}</th>
                      <td>{formatDate(code.createdAt)}</td>
                      <td>{formatDate(code.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
