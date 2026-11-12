import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { QuotesContainer } from "@/app/features/thread/quotes-container";

type Props = {
  handle: string;
  rkey: string;
};

export function QuotesPage(props: Props) {
  return (
    <ThreeColumnLayout>
      <QuotesContainer {...props} />
    </ThreeColumnLayout>
  );
}
