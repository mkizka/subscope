import { useState } from "react";
import { useFetcher } from "react-router";

import { Layout } from "~/components/Layout";
import { LoginForm } from "~/components/LoginForm";
import { getSessionUserDid } from "~/server/oauth/session";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope Admin Dashboard" },
    { name: "description", content: "Subscope administration panel" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const userDid = await getSessionUserDid(request);
  return { userDid };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher<{ inviteCode?: string; error?: string }>();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleCreateInviteCode = () => {
    void fetcher.submit(null, {
      method: "POST",
      action: "/bff/me.subsco.admin.createInviteCode",
    });
  };

  if (fetcher.data?.inviteCode && !inviteCode) {
    setInviteCode(fetcher.data.inviteCode);
  }

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

            {inviteCode && (
              <div className="alert alert-success mt-4">
                <span className="icon-[tabler--check] size-5"></span>
                <div>
                  <h3 className="font-bold">招待コードが作成されました</h3>
                  <div className="text-xs">
                    <code className="bg-success/20 px-2 py-1 rounded font-mono text-sm select-all">
                      {inviteCode}
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
      </div>
    </Layout>
  );
}
