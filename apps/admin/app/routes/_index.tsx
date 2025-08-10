import { SubscoAgent } from "@repo/client/api";
import { useFetcher } from "react-router";

import { Layout } from "~/components/Layout";
import { LoginForm } from "~/components/LoginForm";
import { env } from "~/server/env";
import { injector } from "~/server/injector";
import { oauthClient } from "~/server/oauth/client";
import { getSessionUserDid } from "~/server/oauth/session";

import type { Route } from "./+types/_index";
import type { action as createInviteCodeAction } from "./bff.[me.subsco.admin.createInviteCode]";

export function meta() {
  return [
    { title: "Subscope Admin Dashboard" },
    { name: "description", content: "Subscope administration panel" },
  ];
}

const loggerManager = injector.resolve("loggerManager");
const logger = loggerManager.createLogger("index");

export async function loader({ request }: Route.LoaderArgs) {
  const userDid = await getSessionUserDid(request);

  if (!userDid) {
    return { userDid: null, inviteCodes: [] };
  }

  try {
    const oauthSession = await oauthClient.restore(userDid);
    const agent = new SubscoAgent({
      sessionManager: oauthSession,
      atprotoProxy: env.ATPROTO_PROXY,
    });

    const response = await agent.me.subsco.admin.getInviteCodes({});

    return {
      userDid,
      inviteCodes: response.data.codes,
    };
  } catch (error) {
    logger.error(error, "Failed to get invite codes");
    return { userDid, inviteCodes: [] };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<typeof createInviteCodeAction>();

  const handleCreateInviteCode = () => {
    void fetcher.submit(null, {
      method: "POST",
      action: "/bff/me.subsco.admin.createInviteCode",
    });
  };

  if (!loaderData.userDid) {
    return <LoginForm />;
  }

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

            {loaderData.inviteCodes.length > 0 && (
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
                    {loaderData.inviteCodes.map((inviteCode) => (
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

            {loaderData.inviteCodes.length === 0 && (
              <div className="text-center text-base-content/60 py-4">
                招待コードがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
