import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { TrackedAccountsContainer } from "@/app/features/profile/blocks/tracked-accounts-container";

export function TrackedAccountsPage() {
  return (
    <ThreeColumnLayout>
      <TrackedAccountsContainer />
    </ThreeColumnLayout>
  );
}
