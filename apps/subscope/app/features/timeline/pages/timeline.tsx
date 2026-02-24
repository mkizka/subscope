import { AppLayout } from "@/app/components/layout";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";
import { TimelineHeaderContainer } from "@/app/features/timeline/blocks/timeline-header-container";
import { WelcomeSectionContainer } from "@/app/features/timeline/blocks/welcome-section-container";

type Props = {
  atprotoProxy: string;
};

export function TimelinePage({ atprotoProxy }: Props) {
  return (
    <AppLayout header={<TimelineHeaderContainer />}>
      <WelcomeSectionContainer atprotoProxy={atprotoProxy} />
      <TimelineFeedContainer />
    </AppLayout>
  );
}
