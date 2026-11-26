import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { Input } from "@/app/components/ui/input";
import { Tabs } from "@/app/components/ui/tabs";
import { type Account, AccountList } from "@/app/features/account/account-list";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader as serverMembersLoader } from "@/app/routes/api.server-members";
import type { loader as trackedLoader } from "@/app/routes/api.tracked-accounts";

type ServerMembersResponse = Awaited<
  ReturnType<typeof serverMembersLoader>
>["data"];
type TrackedResponse = Awaited<ReturnType<typeof trackedLoader>>["data"];

export function AccountsContainer() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [tracked, setTracked] = useState(false);

  const serverMembersQuery = useQuery({
    queryKey: ["clientServerMembers", q],
    queryFn: () =>
      fetchJson<ServerMembersResponse>(
        `/api/server-members?${new URLSearchParams({ q })}`,
      ),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });
  const trackedQuery = useQuery({
    queryKey: ["trackedAccounts", q],
    queryFn: () =>
      fetchJson<TrackedResponse>(
        `/api/tracked-accounts?${new URLSearchParams({ q })}`,
      ),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });
  const serverMembers = serverMembersQuery.data;
  const trackedData = trackedQuery.data;

  const accounts: Account[] | undefined = tracked
    ? trackedData?.accounts
    : serverMembers?.serverMembers;

  return (
    <>
      <Tabs
        tabs={[
          {
            label: "メンバー",
            selected: !tracked,
            onClick: () => setTracked(false),
          },
          {
            label: "誰かがフォロー",
            selected: tracked,
            onClick: () => setTracked(true),
          },
        ]}
      />
      <div className="p-4">
        <Input
          type="search"
          aria-label="アカウントを検索"
          placeholder="名前・ハンドルで検索"
          value={q}
          onChange={(e) =>
            setParams(
              (prev) => {
                const next = new URLSearchParams(prev);
                if (e.target.value) next.set("q", e.target.value);
                else next.delete("q");
                return next;
              },
              { replace: true },
            )
          }
        />
      </div>
      {accounts ? (
        accounts.length > 0 ? (
          <AccountList accounts={accounts} />
        ) : (
          <p className="p-4 text-center text-muted">
            アカウントが見つかりません
          </p>
        )
      ) : (
        <AccountsSkeleton />
      )}
    </>
  );
}
