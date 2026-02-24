import { WelcomeSection } from "@/app/features/timeline/parts/welcome-section";

type Props = {
  atprotoProxy: string;
};

export function WelcomeSectionContainer({ atprotoProxy }: Props) {
  return <WelcomeSection atprotoProxy={atprotoProxy} />;
}
