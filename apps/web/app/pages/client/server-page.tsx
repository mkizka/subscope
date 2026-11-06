import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ServerInfoContainer } from "@/app/features/server/blocks/server-info-container";

export function ServerPage() {
  return (
    <ThreeColumnLayout hideServerCard>
      <ServerInfoContainer />
    </ThreeColumnLayout>
  );
}
