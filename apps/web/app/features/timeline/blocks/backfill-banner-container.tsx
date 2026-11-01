import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRevalidator } from "react-router";

import type { loader } from "@/app/routes/api.backfill-status";

import { BackfillBanner } from "./backfill-banner";

type BackfillStatusResponse = Awaited<ReturnType<typeof loader>>["data"];

async function fetchBackfillStatus(): Promise<BackfillStatusResponse> {
  const response = await fetch("/api/backfill-status");
  if (!response.ok) {
    throw new Error("取り込み状態の取得に失敗しました");
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<BackfillStatusResponse>;
}

const isFinished = (data?: BackfillStatusResponse) =>
  data?.inProgress === 0 && data.error === 0;

export function BackfillBannerContainer() {
  const revalidator = useRevalidator();
  const [wasUnfinished, setWasUnfinished] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { data } = useQuery({
    queryKey: ["backfill-status"],
    queryFn: fetchBackfillStatus,
    refetchInterval: (query) => (isFinished(query.state.data) ? false : 30_000),
  });

  if (!data || dismissed) return null;
  if (!isFinished(data) && !wasUnfinished) setWasUnfinished(true);
  if (isFinished(data) && !wasUnfinished) return null;

  return (
    <BackfillBanner
      status={
        data.error > 0 ? "error" : data.inProgress > 0 ? "inProgress" : "done"
      }
      onRefresh={() => {
        void revalidator.revalidate();
        setDismissed(true);
      }}
    />
  );
}
