import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useSearchParams } from "react-router";

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
  const tabParam = useSearchParams()[0].get("tab") ?? "";
  const { data } = useQuery({
    queryKey: ["profile", handle, tabParam],
    queryFn: () =>
      fetchJson<ProfileResponse>(
        `/api/profile/${handle}?${new URLSearchParams({ tab: tabParam })}`,
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
  const { profile, isSelf, backfillStatus, posts, tab } = data;
  const tabs = isSelf
    ? (["posts", "replies", "media", "likes"] as const)
    : (["posts", "replies", "media"] as const);
  return (
    <>
      <ProfileHeader
        displayName={profile.displayName}
        handle={profile.handle}
        avatarUrl={profile.avatar}
        bannerUrl={profile.banner}
        description={profile.description}
        followsCount={profile.followsCount ?? 0}
        followersCount={profile.followersCount ?? 0}
        backfillStatus={backfillStatus}
        action={
          !isSelf && (
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
            to: value === "posts" ? "." : `?tab=${value}`,
            label: tabLabels[value],
            selected: tab === value,
          })),
          { to: "lists", label: "リスト", selected: false },
        ]}
      />
      {/* ponytail: 返信・引用は投稿欄のあるタイムラインでだけ動く。全体ページに投稿欄を置くときにつなぐ */}
      <TimelineFeed posts={posts} />
    </>
  );
}
