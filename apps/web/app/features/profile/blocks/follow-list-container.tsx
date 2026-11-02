import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle.$kind";

import { ActorList } from "./actor-list";

type FollowListResponse = Awaited<ReturnType<typeof loader>>["data"];

const titles = { follows: "フォロー", followers: "フォロワー" };

type Props = {
  handle: string;
  kind: "follows" | "followers";
};

export function FollowListContainer({ handle, kind }: Props) {
  const { data } = useQuery({
    queryKey: ["follow-list", handle, kind],
    queryFn: () =>
      fetchJson<FollowListResponse>(
        `/api/profile/${encodeURIComponent(handle)}/${kind}`,
      ),
    throwOnError: true,
  });

  const subject = data?.subject;
  return (
    <>
      <h1 className="sticky top-0 border-b border-line bg-surface p-4 text-title">
        {titles[kind]}
        {subject && (
          <>
            {" "}
            <span className="font-normal text-muted">
              {subject.displayName || subject.handle}
            </span>
          </>
        )}
      </h1>
      {data ? (
        <ActorList actors={data.actors} />
      ) : (
        <div
          role="status"
          aria-label="読み込み中"
          className="flex justify-center py-6"
        >
          <LoaderCircle className="size-6 animate-spin text-muted" />
        </div>
      )}
    </>
  );
}
