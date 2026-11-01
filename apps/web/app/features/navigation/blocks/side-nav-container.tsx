import { useQuery } from "@tanstack/react-query";

import type { loader } from "@/app/routes/api.me";

import { SideNav } from "./side-nav";

type MeResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchMe(): Promise<MeResponse> {
  const response = await fetch("/api/me");
  if (!response.ok) {
    throw new Error("プロフィールの取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<MeResponse>;
}

export function useMe() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });
  if (!data) return undefined;
  return {
    ...data,
    profileId: data.handle === "handle.invalid" ? data.did : data.handle,
  };
}

export function SideNavContainer() {
  const me = useMe();

  return (
    <SideNav
      profileId={me?.profileId}
      avatarUrl={me?.avatarUrl}
      handle={me?.handle}
      isAdmin={me?.isAdmin}
    />
  );
}
