import type { ComponentProps } from "react";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ThreadView } from "@/app/features/thread/blocks/thread-view";

export function ThreadPage(props: ComponentProps<typeof ThreadView>) {
  return (
    <ThreeColumnLayout>
      <ThreadView {...props} />
    </ThreeColumnLayout>
  );
}
