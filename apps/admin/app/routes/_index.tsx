import { useState } from "react";
import { useFetcher } from "react-router";

import { getSessionUserDid } from "~/server/oauth/session";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope Admin Dashboard" },
    { name: "description", content: "Subscope administration panel" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const userDid = await getSessionUserDid(request);
  return {
    userDid,
    message: context.VALUE_FROM_EXPRESS,
  };
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
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
            <form method="post" action="/login" className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bluesky Handle
                </label>
                <input
                  type="text"
                  name="identifier"
                  id="identifier"
                  required
                  placeholder="example.bsky.social"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                ログイン
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <div className="space-y-2 text-sm text-gray-600">
            <p>{loaderData.message}</p>
            <p>
              User DID:{" "}
              <span className="font-mono text-xs">{loaderData.userDid}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">招待コード管理</h2>

          <button
            onClick={handleCreateInviteCode}
            disabled={fetcher.state === "submitting"}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {fetcher.state === "submitting" ? "作成中..." : "招待コード作成"}
          </button>

          {inviteCode && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">招待コードが作成されました:</p>
              <code className="block mt-2 p-2 bg-gray-100 rounded text-sm font-mono select-all">
                {inviteCode}
              </code>
            </div>
          )}

          {fetcher.data?.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">エラー: {fetcher.data.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
