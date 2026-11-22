import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

import { InfiniteScrollTrigger } from "@/app/components/infinite-scroll-trigger";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { Tabs } from "@/app/components/ui/tabs";
import { FollowButtonContainer } from "@/app/features/account/follow-button-container";
import { AddToListContainer } from "@/app/features/list/add-to-list-container";
import { ListsContainer } from "@/app/features/list/lists-container";
import { TimelineFeed } from "@/app/features/timeline/timeline-feed";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle";

import { IncompleteNotice } from "./incomplete-notice";
import { ProfileHeader } from "./profile-header";

type ProfileResponse = Awaited<ReturnType<typeof loader>>["data"];

const tabs = [
  ["posts", "投稿"],
  ["replies", "リプライ"],
  ["media", "メディア"],
  ["video", "動画"],
  ["likes", "いいね"],
  ["lists", "リスト"],
] as const;

type Props = {
  handle: string;
};

export function ProfileContainer({ handle }: Props) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("posts");
  const postsTab = tab === "lists" ? "posts" : tab;
  const {
    data: pages,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["profile", handle, postsTab],
    queryFn: ({ pageParam }) =>
      fetchJson<ProfileResponse>(
        `/api/profile/${handle}?${new URLSearchParams({ tab: postsTab, ...(pageParam && { cursor: pageParam }) })}`,
      ),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const data = pages?.pages[0];
  const { profile } = data ?? {};
  return (
    <>
      <ProfileHeader
        loading={!data}
        displayName={profile?.displayName}
        handle={profile?.handle ?? handle}
        avatarUrl={profile?.avatar}
        bannerUrl={profile?.banner}
        description={profile?.description}
        links={profile?.links}
        followsCount={profile && (profile.followsCount ?? 0)}
        followersCount={profile && (profile.followersCount ?? 0)}
        backfillStatus={data?.backfillStatus}
        untracked={!!data && !data.backfillStatus}
        followedBy={!!profile?.viewer?.followedBy}
        knownFollowers={profile?.viewer?.knownFollowers}
        action={
          profile && (
            <div className="flex items-center gap-2">
              {!data?.isSelf && (
                <FollowButtonContainer
                  did={profile.did}
                  viewerFollowing={profile.viewer?.following}
                />
              )}
              <AddToListContainer did={profile.did} />
            </div>
          )
        }
      />
      {data && (
        <Tabs
          tabs={tabs.map(([value, label]) => ({
            label,
            selected: tab === value,
            onClick: () => setTab(value),
          }))}
        />
      )}
      {data && !data.isMember && <IncompleteNotice />}
      {tab === "lists" ? (
        <ListsContainer handle={handle} />
      ) : pages && data && !isPlaceholderData ? (
        // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
        <>
          <TimelineFeed posts={pages.pages.flatMap((page) => page.posts)} />
          {hasNextPage && (
            <LoadingSpinner label="続きを読み込み中">
              <InfiniteScrollTrigger
                onIntersect={() => void fetchNextPage({ cancelRefetch: false })}
                enabled={!isFetchingNextPage}
              />
            </LoadingSpinner>
          )}
        </>
      ) : (
        <PostsSkeleton />
      )}
    </>
  );
}
