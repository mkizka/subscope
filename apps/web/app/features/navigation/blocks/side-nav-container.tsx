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

export function SideNavContainer() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  return (
    <SideNav
      did={data?.did}
      avatarUrl={data?.avatarUrl}
      handle={data?.handle}
      isAdmin={data?.isAdmin}
    />
  );
}
