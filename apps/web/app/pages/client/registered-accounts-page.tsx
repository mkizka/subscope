import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Account,
  AccountList,
} from "@/app/features/profile/blocks/account-list";

type Props = {
  registeredAccounts: Account[];
  hasMore: boolean;
};

export function RegisteredAccountsPage({ registeredAccounts, hasMore }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-title">
        登録アカウント{" "}
        <span className="font-normal text-muted">
          {registeredAccounts.length}人{hasMore && "以上"}
        </span>
      </h1>
      <AccountList accounts={registeredAccounts} />
    </ThreeColumnLayout>
  );
}
