import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { RowsSkeleton } from "@/app/components/rows-skeleton";
import { Input } from "@/app/components/ui/input";
import { Tabs } from "@/app/components/ui/tabs";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader as registeredLoader } from "@/app/routes/api.registered-accounts";
import type { loader as trackedLoader } from "@/app/routes/api.tracked-accounts";

import { type Account, AccountList } from "./account-list";

type RegisteredResponse = Awaited<ReturnType<typeof registeredLoader>>["data"];
type TrackedResponse = Awaited<ReturnType<typeof trackedLoader>>["data"];

export function AccountsContainer() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tracked = params.get("tab") === "tracked";

  const registeredQuery = useQuery({
    queryKey: ["clientRegisteredAccounts", q],
    queryFn: () =>
      fetchJson<RegisteredResponse>(
        `/api/registered-accounts?${new URLSearchParams({ q })}`,
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
  const registered = registeredQuery.data;
  const trackedData = trackedQuery.data;

  const accounts: Account[] | undefined = tracked
    ? trackedData?.accounts
    : registered?.registeredAccounts;

  return (
    <>
      <Tabs
        tabs={[
          {
            to: "/server",
            label: `メンバー${registered && !q ? ` ${registered.registeredAccounts.length}${registered.hasMore ? "+" : ""}` : ""}`,
            selected: !tracked,
          },
          {
            to: "/server?tab=tracked",
            label: `誰かがフォロー${trackedData ? ` ${trackedData.total}` : ""}`,
            selected: tracked,
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
        <RowsSkeleton />
      )}
    </>
  );
}
