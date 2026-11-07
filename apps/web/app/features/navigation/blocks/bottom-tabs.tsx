import { BellIcon, CircleUserIcon, HomeIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

import { Badge } from "@/app/components/ui/badge";

type Props = {
  profileId?: string;
  unreadCount: number;
};

function Tab({
  to,
  icon,
  label,
  children,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  children?: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
      aria-label={label}
      className={({ isActive }) =>
        `relative flex items-center justify-center py-3 ${isActive ? "text-ink" : "text-muted"}`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

export function BottomTabs({ profileId, unreadCount }: Props) {
  return (
    <nav
      aria-label="タブバー"
      className="
        fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-line
        bg-surface
        lg:hidden
      "
    >
      <Tab to="/" label="ホーム" icon={<HomeIcon className="size-6" />} />
      <Tab to="/search" label="検索" icon={<SearchIcon className="size-6" />} />
      <Tab
        to="/notifications"
        label="通知"
        icon={<BellIcon className="size-6" />}
      >
        {unreadCount > 0 && (
          <span className="absolute top-1 left-1/2 ml-1">
            <Badge variant="count">{unreadCount}</Badge>
          </span>
        )}
      </Tab>
      <Tab
        to={profileId ? `/${profileId}` : "/"}
        label="プロフィール"
        icon={<CircleUserIcon className="size-6" />}
      />
    </nav>
  );
}
