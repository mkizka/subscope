import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";

type Props = {
  registeredAccounts: Actor[];
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
      <ActorList actors={registeredAccounts} />
    </ThreeColumnLayout>
  );
}
