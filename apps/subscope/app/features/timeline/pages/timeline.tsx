import { AppLayout } from "@/app/components/layout";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";

export function TimelinePage() {
  return (
    <AppLayout>
      <div className="flex w-full flex-col py-4">
        <h1 className="px-4 pb-3 text-xl font-bold">タイムライン</h1>
        <TimelineFeedContainer />
      </div>
    </AppLayout>
  );
}
