import { useQuery } from "@tanstack/react-query";

import { RowsSkeleton } from "@/app/components/rows-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.lists.$handle";

import { ListForm } from "./list-form";
import { ListLinks } from "./list-links";

type ListsResponse = Awaited<ReturnType<typeof loader>>["data"];

export function ListsContainer({ handle }: { handle: string }) {
  const { data } = useQuery({
    queryKey: ["lists", handle],
    queryFn: () => fetchJson<ListsResponse>(`/api/lists/${handle}`),
    throwOnError: true,
  });

  if (!data) {
    return <RowsSkeleton />;
  }
  return (
    <>
      {data.isSelf && (
        <ListForm summary="新しいリスト" submitLabel="作成する" />
      )}
      <ListLinks lists={data.lists} />
    </>
  );
}
