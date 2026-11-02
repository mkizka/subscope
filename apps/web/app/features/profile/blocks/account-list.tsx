import type { BackfillStatus } from "@repo/common/domain";
import { ShieldIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { BackfillStatusBadge } from "@/app/features/profile/parts/backfill-status-badge";

export type Account = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  registeredFollowersCount?: number;
  isAdmin?: boolean;
  backfillStatus?: BackfillStatus;
};

type Props<T extends Account> = {
  accounts: T[];
  renderAction?: (account: T) => ReactNode;
};

export function AccountList<T extends Account>({
  accounts,
  renderAction,
}: Props<T>) {
  return (
    <ul>
      {accounts.map((account) => {
        const profileId =
          account.handle === "handle.invalid" ? account.did : account.handle;
        return (
          <li
            key={account.did}
            className="flex items-center border-b border-line pr-2"
          >
            <Link
              to={`/profile/${profileId}`}
              className="
                flex min-w-0 flex-1 items-center gap-3 px-4 py-3
                hover:bg-surface-2
              "
            >
              <Avatar src={account.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-bold">
                  {account.displayName || profileId}
                </p>
                <p className="truncate text-label text-muted">@{profileId}</p>
                {account.description && (
                  <p className="truncate text-label">{account.description}</p>
                )}
                <div
                  className="
                    mt-1 flex flex-wrap gap-1
                    empty:hidden
                  "
                >
                  {account.isAdmin && (
                    <Badge>
                      <ShieldIcon className="mr-1 size-3" />
                      管理者
                    </Badge>
                  )}
                  {account.backfillStatus && (
                    <BackfillStatusBadge status={account.backfillStatus} />
                  )}
                  {account.registeredFollowersCount !== undefined && (
                    <Badge>
                      {account.registeredFollowersCount}人からフォロー
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
            {renderAction?.(account)}
          </li>
        );
      })}
    </ul>
  );
}
