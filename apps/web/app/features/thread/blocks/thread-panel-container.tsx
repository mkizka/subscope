import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import type { loader } from "@/app/routes/api.thread";

import { ThreadPanel } from "./thread-panel";

type ThreadResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchThread(uri: string): Promise<ThreadResponse> {
  const response = await fetch(`/api/thread?${new URLSearchParams({ uri })}`);
  if (!response.ok) {
    throw new Error("スレッドの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<ThreadResponse>;
}

type Props = {
  uri: string;
};

export function ThreadPanelContainer({ uri }: Props) {
  const [searchParams] = useSearchParams();
  const { data } = useQuery({
    queryKey: ["thread", uri],
    queryFn: () => fetchThread(uri),
  });

  const closeParams = new URLSearchParams(searchParams);
  closeParams.delete("thread");

  return <ThreadPanel thread={data} closeSearch={closeParams.toString()} />;
}
