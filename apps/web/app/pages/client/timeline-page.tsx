import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import { BackfillBannerContainer } from "@/app/features/timeline/backfill-banner-container";
import { TimelineFeedContainer } from "@/app/features/timeline/timeline-feed-container";
import { useReloadTimeline } from "@/app/lib/use-reload-timeline";

export function TimelinePage({ local }: { local: boolean }) {
  const reloadTimeline = useReloadTimeline();
  return (
    <ThreeColumnLayout>
      <div
        className="
          sticky top-14 z-sticky bg-surface transition-transform
          lg:top-0
          max-lg:[header[data-visible=false]~&]:-translate-y-14
        "
      >
        <Tabs
          onSelect={reloadTimeline}
          tabs={[
            { to: "/", label: "フォロー中", selected: !local },
            { to: "/?tab=local", label: "ローカル", selected: local },
          ]}
        />
      </div>
      {!local && <BackfillBannerContainer />}
      <TimelineFeedContainer local={local} />
    </ThreeColumnLayout>
  );
}
