import { useQuery } from "@tanstack/react-query";

import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.thread";

import { ThreadView } from "./thread-view";

type ThreadResponse = Awaited<ReturnType<typeof loader>>["data"];

type Props = {
  handle: string;
  rkey: string;
};

export function ThreadViewContainer({ handle, rkey }: Props) {
  const { data, isError } = useQuery({
    queryKey: ["thread", handle, rkey],
    queryFn: () =>
      fetchJson<ThreadResponse>(
        `/api/thread?${new URLSearchParams({ handle, rkey })}`,
      ),
    retry: false,
  });

  if (isError) {
    return (
      <p className="py-8 text-center text-label text-muted">
        投稿が見つかりません
      </p>
    );
  }
  if (!data) {
    return <PostsSkeleton />;
  }
  return <ThreadView thread={data} />;
}
