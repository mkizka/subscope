import { AppLayout } from "@/app/components/layout";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";
import { TimelineHeaderContainer } from "@/app/features/timeline/parts/timeline-header-container";

export function TimelinePage() {
  return (
    <AppLayout header={<TimelineHeaderContainer />}>
      <div className="flex w-full flex-col py-4">
        <TimelineFeedContainer />
      </div>
    </AppLayout>
  );
}
