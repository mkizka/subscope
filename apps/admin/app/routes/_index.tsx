import type { MeSubscoAdminGetInviteCodes } from "@repo/client/api";
import { useCallback, useState } from "react";
import { redirect, useFetcher } from "react-router";

import { Layout } from "~/components/Layout";
import { injector } from "~/server/injector";
import { getSessionAgent } from "~/server/oauth/session";

import type { Route } from "./+types/_index";
import type { action as createInviteCodeAction } from "./bff.[me.subsco.admin.createInviteCode]";

const loggerManager = injector.resolve("loggerManager");
const logger = loggerManager.createLogger("index");

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await getSessionAgent(request);

  if (!agent) {
    return redirect("/login");
  }

  try {
    const response = await agent.me.subsco.admin.getInviteCodes({ limit: 5 });
    return {
      userDid: agent.did,
      inviteCodes: response.data.codes,
      cursor: response.data.cursor,
    };
  } catch (error) {
    logger.error(error, "Failed to get invite codes");
    return { userDid: agent.did, inviteCodes: [], cursor: undefined };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof createInviteCodeAction>();

  const [inviteCodes, setInviteCodes] = useState(loaderData.inviteCodes);
  const [currentCursor, setCurrentCursor] = useState(loaderData.cursor);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateInviteCode = () => {
    void fetcher.submit(null, {
      method: "POST",
      action: "/bff/me.subsco.admin.createInviteCode",
    });
  };

  const handleLoadMore = useCallback(async () => {
    if (!currentCursor || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/bff/me.subsco.admin.getInviteCodes?cursor=${currentCursor}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load more");
      }

      const data =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        (await response.json()) as MeSubscoAdminGetInviteCodes.OutputSchema;

      setInviteCodes((prev) => [...prev, ...data.codes]);
      setCurrentCursor(data.cursor);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [currentCursor, isLoading]);

  return (
    <Layout userDid={loaderData.userDid}>
      <div className="space-y-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h1 className="card-title text-2xl">Admin Dashboard</h1>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">招待コード管理</h2>

            <button
              onClick={handleCreateInviteCode}
              disabled={fetcher.state === "submitting"}
              className="btn btn-primary gap-2"
            >
              <span className="icon-[tabler--qrcode] size-4"></span>
              {fetcher.state === "submitting" ? "作成中..." : "招待コード作成"}
            </button>

            {fetcher.data?.inviteCode && (
              <div className="alert alert-success mt-4">
                <span className="icon-[tabler--check] size-5"></span>
                <div>
                  <h3 className="font-bold">招待コードが作成されました</h3>
                  <div className="text-xs">
                    <code className="bg-success/20 px-2 py-1 rounded font-mono text-sm select-all">
                      {fetcher.data.inviteCode}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {fetcher.data?.error && (
              <div className="alert alert-error mt-4">
                <span className="icon-[tabler--exclamation-circle] size-5"></span>
                <span>エラー: {fetcher.data.error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">招待コード一覧</h2>

            {inviteCodes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>コード</th>
                      <th>有効期限</th>
                      <th>作成日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteCodes.map((inviteCode) => (
                      <tr key={inviteCode.code}>
                        <td>
                          <code className="bg-base-200 px-2 py-1 rounded font-mono text-xs">
                            {inviteCode.code}
                          </code>
                        </td>
                        <td>
                          {new Date(inviteCode.expiresAt).toLocaleDateString(
                            "ja-JP",
                          )}
                        </td>
                        <td>
                          {new Date(inviteCode.createdAt).toLocaleDateString(
                            "ja-JP",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {inviteCodes.length === 0 && (
              <div className="text-center text-base-content/60 py-4">
                招待コードがありません
              </div>
            )}

            {currentCursor && (
              <div className="text-center mt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="btn btn-outline btn-sm"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      読み込み中...
                    </>
                  ) : (
                    "もっと読み込む"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
