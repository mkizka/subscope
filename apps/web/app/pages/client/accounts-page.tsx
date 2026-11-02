import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { AccountsContainer } from "@/app/features/profile/blocks/accounts-container";

export function AccountsPage() {
  return (
    <ThreeColumnLayout>
      <AccountsContainer />
    </ThreeColumnLayout>
  );
}
