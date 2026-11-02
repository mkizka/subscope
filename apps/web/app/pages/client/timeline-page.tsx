import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { BackfillBannerContainer } from "@/app/features/timeline/blocks/backfill-banner-container";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";

export function TimelinePage() {
  return (
    <ThreeColumnLayout>
      <h1
        className="
          sticky top-0 z-10 border-b border-line bg-surface p-4 text-heading
        "
      >
        フォロー中
      </h1>
      <BackfillBannerContainer />
      <TimelineFeedContainer />
    </ThreeColumnLayout>
  );
}
