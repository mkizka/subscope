import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { AccountsSkeleton } from "@/app/components/rows-skeleton";
import { Tabs } from "@/app/components/ui/tabs";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle.$kind";

import { AccountList } from "./account-list";

type FollowListResponse = Awaited<ReturnType<typeof loader>>["data"];

const titles = { follows: "フォロー", followers: "フォロワー" };
const emptyMessages = {
  follows: "フォローしているアカウントはありません",
  followers: "フォロワーはいません",
};

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
      <header
        className="
          sticky top-0 z-sticky flex items-center gap-2 border-b border-line
          bg-surface p-4
        "
      >
        <Link to={`/${handle}`} aria-label="戻る" className="text-muted">
          <ArrowLeftIcon className="size-5" />
        </Link>
        <h1 className="text-title">
          {subject ? `${subject.displayName || subject.handle}の` : ""}
          {titles[kind]}
        </h1>
      </header>
      {kind === "followers" && (
        <Tabs
          tabs={[
            { to: ".", label: "すべて", selected: !registered },
            {
              to: "?filter=registered",
              label: `メンバー${data?.registeredCount === undefined ? "" : ` ${data.registeredCount}`}`,
              selected: registered,
            },
          ]}
        />
      )}
      {!data ? (
        <AccountsSkeleton />
      ) : data.accounts.length === 0 ? (
        <p className="py-8 text-center text-label text-muted">
          {emptyMessages[kind]}
        </p>
      ) : (
        <AccountList accounts={data.accounts} />
      )}
    </>
  );
}
