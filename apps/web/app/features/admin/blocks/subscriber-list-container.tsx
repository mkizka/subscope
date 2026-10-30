import type { $OutputBody as BannedActorsResponse } from "@repo/client/lex/me/subsco/admin/getBannedActors";
import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getSubscribers";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

import { SubscriberList, type SubscriberTab } from "./subscriber-list";

async function fetchBannedActors(
  cursor?: string,
): Promise<BannedActorsResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/admin/api/banned-actors?${params.toString()}`);
  if (!response.ok) {
    throw new Error("BAN済みアカウントの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<BannedActorsResponse>;
}

async function unbanActor(did: string) {
  const response = await fetch("/admin/api/banned-actors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("BANの解除に失敗しました");
  }
}

async function fetchSubscribers(cursor?: string): Promise<$OutputBody> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/admin/api/subscribers?${params.toString()}`);
  if (!response.ok) {
    throw new Error("登録アカウントの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<$OutputBody>;
}

async function updateSubscriber(method: "POST" | "DELETE", did: string) {
  const response = await fetch("/admin/api/subscribers", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("登録アカウントの更新に失敗しました");
  }
}

export function SubscriberListContainer() {
  const [tab, setTab] = useState<SubscriberTab>("subscribers");
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["subscribers"] }),
      queryClient.invalidateQueries({ queryKey: ["bannedActors"] }),
    ]);
  const grantAdminMutation = useMutation({
    mutationFn: (did: string) => updateSubscriber("POST", did),
    onSuccess,
  });
  const banMutation = useMutation({
    mutationFn: (did: string) => updateSubscriber("DELETE", did),
    onSuccess,
  });
  const unbanMutation = useMutation({ mutationFn: unbanActor, onSuccess });
  const bannedQuery = useInfiniteQuery({
    queryKey: ["bannedActors"],
    queryFn: ({ pageParam }) => fetchBannedActors(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => data.pages.flatMap((page) => page.actors),
    enabled: tab === "banned",
  });
  const subscribersQuery = useInfiniteQuery({
    queryKey: ["subscribers"],
    queryFn: ({ pageParam }) => fetchSubscribers(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => ({
      total: data.pages[0]?.total,
      subscribers: data.pages.flatMap((page) =>
        page.subscribers.map(({ profile, isAdmin, subscribedAt }) => ({
          ...profile,
          isAdmin,
          subscribedAt,
        })),
      ),
    }),
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    tab === "banned" ? bannedQuery : subscribersQuery;

  return (
    <SubscriberList
      tab={tab}
      onTabChange={setTab}
      subscribers={subscribersQuery.data?.subscribers ?? []}
      bannedActors={bannedQuery.data ?? []}
      total={subscribersQuery.data?.total}
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
