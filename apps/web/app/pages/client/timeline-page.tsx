import { useState } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import { BackfillBannerContainer } from "@/app/features/timeline/backfill-banner-container";
import { TimelineFeedContainer } from "@/app/features/timeline/timeline-feed-container";
import { useReloadTimeline } from "@/app/lib/use-reload-timeline";

export function TimelinePage({
  defaultLocal = false,
}: {
  defaultLocal?: boolean;
}) {
  const [local, setLocal] = useState(defaultLocal);
  const reloadTimeline = useReloadTimeline();
  const select = (value: boolean) =>
    value === local ? reloadTimeline() : setLocal(value);
  return (
    <ThreeColumnLayout>
      <Tabs
        tabs={[
          {
            label: "フォロー中",
            selected: !local,
            onClick: () => select(false),
          },
          { label: "ローカル", selected: local, onClick: () => select(true) },
        ]}
      />
      {!local && <BackfillBannerContainer />}
      <TimelineFeedContainer local={local} />
    </ThreeColumnLayout>
  );
}
