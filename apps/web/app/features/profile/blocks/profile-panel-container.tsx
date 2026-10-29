import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import type { loader } from "@/app/routes/api.profile.$handle";

import { ProfilePanel } from "./profile-panel";

type ProfileResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchProfile(handle: string): Promise<ProfileResponse> {
  const response = await fetch(`/api/profile/${encodeURIComponent(handle)}`);
  if (!response.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<ProfileResponse>;
}

type Props = {
  handle: string;
};

export function ProfilePanelContainer({ handle }: Props) {
  const [searchParams] = useSearchParams();
  const { data } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => fetchProfile(handle),
  });

  const closeParams = new URLSearchParams(searchParams);
  closeParams.delete("profile");

  return (
    <ProfilePanel
      handle={data?.handle ?? handle}
      displayName={data?.displayName}
      avatarUrl={data?.avatar}
      description={data?.description}
      followsCount={data?.followsCount}
      followersCount={data?.followersCount}
      closeSearch={closeParams.toString()}
    />
  );
}
