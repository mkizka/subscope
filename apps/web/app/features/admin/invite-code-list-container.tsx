import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { Skeleton } from "@/app/components/ui/skeleton";
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
      {!data && (
        <li role="status" aria-label="読み込み中">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-line px-4 py-3"
            >
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-5 w-12" />
              <span className="size-10" />
            </div>
          ))}
        </li>
      )}
      {data && hasNextPage && (
        <li
          role="status"
          aria-label="続きを読み込み中"
          className="flex justify-center py-6"
        >
          <LoaderCircle className="size-6 animate-spin text-muted" />
          <InfiniteScrollTrigger
            onIntersect={() => void fetchNextPage()}
            enabled={!isFetchingNextPage}
          />
        </li>
      )}
    </InviteCodeList>
  );
}
