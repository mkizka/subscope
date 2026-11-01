import { BellIcon, CircleUserIcon, HomeIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

type Props = {
  profileId?: string;
  unreadCount: number;
};

function Tab({
  to,
  icon,
  children,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? "text-primary" : "text-base-content/70"}`
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
        fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-base-300
        bg-base-100
        lg:hidden
      "
    >
      <Tab to="/" icon={<HomeIcon className="size-6" />}>
        ホーム
      </Tab>
      <Tab to="/search" icon={<SearchIcon className="size-6" />}>
        検索
      </Tab>
      <Tab to="/notifications" icon={<BellIcon className="size-6" />}>
        通知
        {unreadCount > 0 && (
          <span
            className="
              absolute top-1 left-1/2 ml-1 rounded-full bg-primary px-1.5
              text-[10px] text-primary-content
            "
          >
            {unreadCount}
          </span>
        )}
      </Tab>
      <Tab
        to={profileId ? `/profile/${profileId}` : "/"}
        icon={<CircleUserIcon className="size-6" />}
      >
        プロフィール
      </Tab>
    </nav>
  );
}
