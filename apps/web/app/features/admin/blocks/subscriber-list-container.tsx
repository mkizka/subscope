import type { $OutputBody } from "@repo/client/lex/me/subsco/admin/getSubscribers";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { SubscriberList } from "./subscriber-list";

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

async function grantAdmin(did: string) {
  const response = await fetch("/admin/api/subscribers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("管理者の付与に失敗しました");
  }
}

export function SubscriberListContainer() {
  const queryClient = useQueryClient();
  const grantAdminMutation = useMutation({
    mutationFn: grantAdmin,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["subscribers"] }),
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
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

  return (
    <SubscriberList
      subscribers={data ?? []}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      onGrantAdmin={grantAdminMutation.mutate}
      grantingDid={
        grantAdminMutation.isPending ? grantAdminMutation.variables : null
      }
    />
  );
}
