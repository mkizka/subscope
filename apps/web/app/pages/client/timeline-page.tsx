import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import { BackfillBannerContainer } from "@/app/features/timeline/backfill-banner-container";
import { TimelineFeedContainer } from "@/app/features/timeline/timeline-feed-container";
import { useReloadTimeline } from "@/app/lib/use-reload-timeline";

export function TimelinePage({ local }: { local: boolean }) {
  const reloadTimeline = useReloadTimeline();
  return (
    <ThreeColumnLayout>
      <Tabs
        onSelect={reloadTimeline}
        tabs={[
          { to: "/", label: "フォロー中", selected: !local },
          { to: "/?tab=local", label: "ローカル", selected: local },
        ]}
      />
      {!local && <BackfillBannerContainer />}
      <TimelineFeedContainer local={local} />
    </ThreeColumnLayout>
  );
}
