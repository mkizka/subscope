import { useQuery } from "@tanstack/react-query";

import { LoadingSpinner } from "@/app/components/loading-spinner";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.lists.$handle";

import { ListLinks } from "./list-links";

type ListsResponse = Awaited<ReturnType<typeof loader>>["data"];

export function ListsContainer({ handle }: { handle: string }) {
  const { data } = useQuery({
    queryKey: ["lists", handle],
    queryFn: () => fetchJson<ListsResponse>(`/api/lists/${handle}`),
    throwOnError: true,
  });

  if (!data) {
    return <LoadingSpinner label="読み込み中" />;
  }
  return <ListLinks handle={handle} lists={data.lists} />;
}
