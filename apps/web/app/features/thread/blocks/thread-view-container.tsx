import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

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
    return (
      <div
        role="status"
        aria-label="読み込み中"
        className="flex justify-center py-6"
      >
        <LoaderCircle className="size-6 animate-spin text-muted" />
      </div>
    );
  }
  return <ThreadView thread={data} />;
}
