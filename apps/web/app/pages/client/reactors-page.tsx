import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ReactorsContainer } from "@/app/features/thread/reactors-container";

type Props = {
  handle: string;
  rkey: string;
  kind: "liked-by" | "reposted-by";
};

export function ReactorsPage(props: Props) {
  return (
    <ThreeColumnLayout>
      <ReactorsContainer {...props} />
    </ThreeColumnLayout>
  );
}
