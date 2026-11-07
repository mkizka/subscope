import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { AccountsContainer } from "@/app/features/profile/blocks/accounts-container";
import { ServerInfoContainer } from "@/app/features/server/blocks/server-info-container";

export function ServerPage() {
  return (
    <ThreeColumnLayout hideServerCard>
      <ServerInfoContainer />
      <AccountsContainer />
    </ThreeColumnLayout>
  );
}
