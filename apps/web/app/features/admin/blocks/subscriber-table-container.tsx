import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getSubscribers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SubscriberTable } from "./subscriber-table";

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

export function SubscriberTableContainer() {
  const [banningDid, setBanningDid] = useState<string | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["subscribers"],
    queryFn: ({ pageParam }) => fetchSubscribers(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) =>
      data.pages.flatMap((page) =>
        page.subscribers.map(({ profile, isAdmin }) => ({
          ...profile,
          isAdmin,
        })),
      ),
  });

  const ban = async (did: string) => {
    setBanningDid(did);
    await fetch("/admin/api/subscribers", {
      method: "POST",
      body: JSON.stringify({ did }),
    });
    await refetch();
    setBanningDid(null);
  };

  return (
    <SubscriberTable
      subscribers={data ?? []}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      onBan={(did) => void ban(did)}
      banningDid={banningDid}
    />
  );
}
