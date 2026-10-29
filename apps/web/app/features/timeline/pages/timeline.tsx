import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { TimelineFeedContainer } from "@/app/features/timeline/blocks/timeline-feed-container";
import { WelcomeSectionContainer } from "@/app/features/timeline/blocks/welcome-section-container";

type Props = {
  atprotoProxy: string;
};

export function TimelinePage({ atprotoProxy }: Props) {
  return (
    <ThreeColumnLayout>
      <WelcomeSectionContainer atprotoProxy={atprotoProxy} />
      <TimelineFeedContainer />
    </ThreeColumnLayout>
  );
}
