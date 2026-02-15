import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { InviteCodeTable } from "./invite-code-table";

type InviteCodesResponse = {
  codes: {
    code: string;
    expiresAt: string;
    createdAt: string;
    usedAt?: string;
    usedBy?: { did: string; handle?: string };
  }[];
  cursor?: string;
};

async function fetchInviteCodes(cursor?: string): Promise<InviteCodesResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/admin/api/invite-codes?${params.toString()}`);
  if (!response.ok) {
    throw new Error("招待コードの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<InviteCodesResponse>;
}

async function createInviteCode(): Promise<void> {
  const response = await fetch("/admin/api/invite-codes", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("招待コードの作成に失敗しました");
  }
}

export function InviteCodeTableContainer() {
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["inviteCodes"],
      queryFn: ({ pageParam }) => fetchInviteCodes(pageParam),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      select: (data) => data.pages.flatMap((page) => page.codes),
    });

  const createMutation = useMutation({
    mutationFn: createInviteCode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
    },
  });

  return (
    <InviteCodeTable
      codes={data ?? []}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      onCreateCode={() => createMutation.mutate()}
      isCreating={createMutation.isPending}
    />
  );
}
