import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Account,
  AccountList,
} from "@/app/features/profile/blocks/account-list";

type Props = {
  accounts: Account[];
  total: number;
};

export function TrackedAccountsPage({ accounts, total }: Props) {
  return (
    <ThreeColumnLayout>
      <div className="flex items-baseline gap-2 border-b border-line p-4">
        <h1 className="text-title">追跡アカウント</h1>
        <span className="text-label text-muted">{total}人</span>
      </div>
      <p
        className="
          border-b border-line bg-surface-2 px-4 py-2 text-label text-muted
        "
      >
        登録アカウントとそのフォロー先です。このサーバーはこの人たちの投稿だけを保存します。
      </p>
      <AccountList accounts={accounts} />
    </ThreeColumnLayout>
  );
}
