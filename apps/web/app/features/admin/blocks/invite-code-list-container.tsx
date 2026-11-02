import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/admin.api.invite-codes";

import { InviteCodeList } from "./invite-code-list";

type InviteCodesResponse = Awaited<ReturnType<typeof loader>>["data"];

const apiUrl = "/admin/api/invite-codes";

export function InviteCodeListContainer() {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["inviteCodes"] });
  const createMutation = useMutation({
    mutationFn: () => fetchJson(apiUrl, { method: "POST" }),
    onSuccess,
  });
  const deleteMutation = useMutation({
    mutationFn: (code: string) =>
      fetchJson(apiUrl, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      }),
    onSuccess,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["inviteCodes"],
      queryFn: ({ pageParam }) =>
        fetchJson<InviteCodesResponse>(
          `${apiUrl}?${new URLSearchParams(pageParam ? { cursor: pageParam } : {})}`,
        ),
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.cursor,
      throwOnError: true,
    });

  return (
    <InviteCodeList
      codes={data?.pages.flatMap((page) => page.codes) ?? []}
      onCreateCode={() => createMutation.mutate()}
      isCreating={createMutation.isPending}
      onDeleteCode={deleteMutation.mutate}
      deletingCode={deleteMutation.isPending ? deleteMutation.variables : null}
      isLoading={!data}
    >
      {(!data || hasNextPage) && (
        <li
          role="status"
          aria-label={data ? "続きを読み込み中" : "読み込み中"}
          className="flex justify-center py-6"
        >
          <LoaderCircle className="size-6 animate-spin text-muted" />
          {data && (
            <InfiniteScrollTrigger
              onIntersect={() => void fetchNextPage()}
              enabled={!isFetchingNextPage}
            />
          )}
        </li>
      )}
    </InviteCodeList>
  );
}
