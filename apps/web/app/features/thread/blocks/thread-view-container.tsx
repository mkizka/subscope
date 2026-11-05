import { useQuery } from "@tanstack/react-query";

import { ThreadSkeleton } from "@/app/features/thread/parts/thread-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.thread";

import { ThreadView } from "./thread-view";

type ThreadResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  handle: string;
  rkey: string;
};

export function ThreadViewContainer({ handle, rkey }: Props) {
  const { data } = useQuery({
    queryKey: ["thread", handle, rkey],
    queryFn: () =>
      fetchJson<ThreadResponse>(
        `/api/thread?${new URLSearchParams({ handle, rkey })}`,
      ),
    throwOnError: true,
  });

  if (!data) {
    return <ThreadSkeleton />;
  }
  return <ThreadView thread={data} />;
}
