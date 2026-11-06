import { useQuery } from "@tanstack/react-query";
import { useOutlet, useSearchParams } from "react-router";

import { PostsSkeleton } from "@/app/components/posts-skeleton";
import { Tabs } from "@/app/components/ui/tabs";
import { TimelineFeed } from "@/app/features/timeline/blocks/timeline-feed";
import { fetchJson } from "@/app/lib/fetch-json";
import type { loader } from "@/app/routes/api.profile.$handle";

import { FollowButtonContainer } from "./follow-button-container";
import { ProfileHeader } from "./profile-header";

type ProfileResponse = Awaited<ReturnType<typeof loader>>["data"];

const tabLabels = {
  posts: "投稿",
  replies: "リプライ",
  media: "メディア",
  likes: "いいね",
};

type Props = {
  handle: string;
};

export function ProfileContainer({ handle }: Props) {
  const listsTab = useOutlet();
  const tabParam = useSearchParams()[0].get("tab") ?? "";
  const { data, isPlaceholderData } = useQuery({
    queryKey: ["profile", handle, tabParam],
    queryFn: () =>
      fetchJson<ProfileResponse>(
        `/api/profile/${handle}?${new URLSearchParams({ tab: tabParam })}`,
      ),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === handle ? previous : undefined,
    throwOnError: true,
  });

  const tabs = data?.isSelf
    ? (["posts", "replies", "media", "likes"] as const)
    : (["posts", "replies", "media"] as const);
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
        followedBy={!!profile?.viewer?.followedBy}
        action={
          profile &&
          !data?.isSelf && (
            <FollowButtonContainer
              did={profile.did}
              viewerFollowing={profile.viewer?.following}
            />
          )
        }
      />
      <Tabs
        tabs={[
          ...tabs.map((value) => ({
            to: value === "posts" ? `/${handle}` : `/${handle}?tab=${value}`,
            label: tabLabels[value],
            selected:
              !listsTab &&
              ((isPlaceholderData ? undefined : data?.tab) ??
                (tabParam || "posts")) === value,
          })),
          {
            to: `/${handle}/lists`,
            label: "リスト",
            selected: !!listsTab,
          },
        ]}
      />
      {listsTab ??
        (data && !isPlaceholderData ? (
          // ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ
          <TimelineFeed posts={data.posts} />
        ) : (
          <PostsSkeleton />
        ))}
    </>
  );
}
