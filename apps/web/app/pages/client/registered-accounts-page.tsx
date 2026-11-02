import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { RegisteredAccountsContainer } from "@/app/features/profile/blocks/registered-accounts-container";

export function RegisteredAccountsPage() {
  return (
    <ThreeColumnLayout>
      <RegisteredAccountsContainer />
    </ThreeColumnLayout>
  );
}
