import type { $OutputBody as BannedAccountsResponse } from "@repo/client/me/subsco/admin/getBannedAccounts";
import type { $OutputBody } from "@repo/client/me/subsco/admin/listRegisteredAccounts";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import {
  RegisteredAccountList,
  type RegisteredAccountTab,
} from "./registered-account-list";

async function fetchBannedAccounts(
  cursor?: string,
): Promise<BannedAccountsResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(
    `/admin/api/banned-accounts?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("停止中アカウントの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<BannedAccountsResponse>;
}

async function unbanAccount(did: string) {
  const response = await fetch("/admin/api/banned-accounts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("登録の再開に失敗しました");
  }
}

async function fetchRegisteredAccounts(cursor?: string): Promise<$OutputBody> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(
    `/admin/api/registered-accounts?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("登録アカウントの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<$OutputBody>;
}

async function updateRegisteredAccount(method: "POST" | "DELETE", did: string) {
  const response = await fetch("/admin/api/registered-accounts", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("登録アカウントの更新に失敗しました");
  }
}

export function RegisteredAccountListContainer() {
  const [searchParams] = useSearchParams();
  const tab: RegisteredAccountTab =
    searchParams.get("tab") === "banned" ? "banned" : "registeredAccounts";
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["registeredAccounts"] }),
      queryClient.invalidateQueries({ queryKey: ["bannedAccounts"] }),
    ]);
  const grantAdminMutation = useMutation({
    mutationFn: (did: string) => updateRegisteredAccount("POST", did),
    onSuccess,
  });
  const banMutation = useMutation({
    mutationFn: (did: string) => updateRegisteredAccount("DELETE", did),
    onSuccess,
  });
  const unbanMutation = useMutation({ mutationFn: unbanAccount, onSuccess });
  const bannedQuery = useInfiniteQuery({
    queryKey: ["bannedAccounts"],
    queryFn: ({ pageParam }) => fetchBannedAccounts(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => data.pages.flatMap((page) => page.actors),
    enabled: tab === "banned",
  });
  const registeredAccountsQuery = useInfiniteQuery({
    queryKey: ["registeredAccounts"],
    queryFn: ({ pageParam }) => fetchRegisteredAccounts(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => ({
      total: data.pages[0]?.total,
      registeredAccounts: data.pages.flatMap((page) =>
        page.registeredAccounts.map(({ profile, ...registeredAccount }) => ({
          ...profile,
          ...registeredAccount,
        })),
      ),
    }),
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    tab === "banned" ? bannedQuery : registeredAccountsQuery;

  return (
    <RegisteredAccountList
      tab={tab}
      registeredAccounts={
        registeredAccountsQuery.data?.registeredAccounts ?? []
      }
      bannedAccounts={bannedQuery.data ?? []}
      total={registeredAccountsQuery.data?.total}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      onGrantAdmin={grantAdminMutation.mutate}
      grantingDid={
        grantAdminMutation.isPending ? grantAdminMutation.variables : null
      }
      onBan={banMutation.mutate}
      banningDid={banMutation.isPending ? banMutation.variables : null}
      onUnban={unbanMutation.mutate}
      unbanningDid={unbanMutation.isPending ? unbanMutation.variables : null}
    />
  );
}
