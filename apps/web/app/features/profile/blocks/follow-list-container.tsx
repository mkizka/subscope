import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { RowsSkeleton } from "@/app/components/rows-skeleton";
import { Tabs } from "@/app/components/ui/tabs";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle.$kind";

import { AccountList } from "./account-list";

type FollowListResponse = Awaited<ReturnType<typeof loader>>["data"];

const titles = { follows: "フォロー", followers: "フォロワー" };

type Props = {
  handle: string;
  kind: "follows" | "followers";
};

export function FollowListContainer({ handle, kind }: Props) {
  const [searchParams] = useSearchParams();
  const registered =
    kind === "followers" && searchParams.get("filter") === "registered";
  const { data } = useQuery({
    queryKey: ["follow-list", handle, kind, registered],
    queryFn: () =>
      fetchJson<FollowListResponse>(
        `/api/profile/${encodeURIComponent(handle)}/${kind}${registered ? "?filter=registered" : ""}`,
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
      {kind === "followers" && (
        <Tabs
          tabs={[
            { to: ".", label: "すべて", selected: !registered },
            {
              to: "?filter=registered",
              label: `登録アカウント${data?.registeredCount === undefined ? "" : ` ${data.registeredCount}`}`,
              selected: registered,
            },
          ]}
        />
      )}
      {data ? <AccountList accounts={data.accounts} /> : <RowsSkeleton />}
    </>
  );
}
