import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ThreadViewContainer } from "@/app/features/thread/blocks/thread-view-container";

type Props = {
  handle: string;
  rkey: string;
};

export function ThreadPage(props: Props) {
  return (
    <ThreeColumnLayout>
      <ThreadViewContainer {...props} />
    </ThreeColumnLayout>
  );
}
