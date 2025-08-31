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

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid gap-2">
      <HeaderCard />
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row justify-center">
          <button className="btn btn-primary w-fit">
            <span className="icon-[tabler--circle-plus] size-5"></span>
            招待コードを新規作成
          </button>
          <button className="btn btn-secondary w-fit">
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
                <tr>
                  <th>localhost-abcdef</th>
                  <td>2023-01-01</td>
                  <td>2023-12-31</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
