import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Tabs } from "@/app/components/ui/tabs";
import { BackfillBannerContainer } from "@/app/features/timeline/blocks/backfill-banner-container";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";

export function TimelinePage({ local }: { local: boolean }) {
  return (
    <ThreeColumnLayout>
      <div
        className="
          sticky top-0 z-10 bg-surface transition-[top]
          [header[data-visible=true]~&]:top-14
          lg:[header[data-visible=true]~&]:top-0
        "
      >
        <Tabs
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
