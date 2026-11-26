import type { $OutputBody } from "@repo/client/me/subsco/admin/listServerMembers";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { AddMemberDialogContainer } from "./add-member-dialog-container";
import { ServerMemberList } from "./server-member-list";

async function fetchServerMembers(cursor?: string): Promise<$OutputBody> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(
    `/admin/api/server-members?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error("メンバーの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<$OutputBody>;
}

async function updateServerMember(method: "POST" | "DELETE", did: string) {
  const response = await fetch("/admin/api/server-members", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ did }),
  });
  if (!response.ok) {
    throw new Error("メンバーの更新に失敗しました");
  }
}

export function ServerMemberListContainer() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["serverMembers"] });
  const grantAdminMutation = useMutation({
    mutationFn: (did: string) => updateServerMember("POST", did),
    onSuccess,
  });
  const removeMutation = useMutation({
    mutationFn: (did: string) => updateServerMember("DELETE", did),
    onSuccess,
  });
  const serverMembersQuery = useInfiniteQuery({
    queryKey: ["serverMembers"],
    queryFn: ({ pageParam }) => fetchServerMembers(pageParam),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    select: (data) => ({
      serverMembers: data.pages.flatMap((page) =>
        page.serverMembers.map(({ profile, ...serverMember }) => ({
          ...profile,
          ...serverMember,
        })),
      ),
    }),
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    serverMembersQuery;

  return (
    <ServerMemberList
      serverMembers={serverMembersQuery.data?.serverMembers ?? []}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => void fetchNextPage({ cancelRefetch: false })}
      hasNextPage={hasNextPage}
      onGrantAdmin={grantAdminMutation.mutate}
      grantingDid={
        grantAdminMutation.isPending ? grantAdminMutation.variables : null
      }
      onRemove={removeMutation.mutate}
      removingDid={removeMutation.isPending ? removeMutation.variables : null}
      addMemberButton={<AddMemberDialogContainer />}
    />
  );
}
