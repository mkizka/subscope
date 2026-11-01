import {
  CircleUserIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  HomeIcon,
  ListIcon,
  LogOutIcon,
  MailIcon,
  RadarIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Form, NavLink } from "react-router";

import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  did?: string;
  avatarUrl?: string;
  handle?: string;
  isAdmin?: boolean;
};

function NavItem({
  to,
  icon,
  children,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end
        className={({ isActive }) => (isActive ? "menu-active" : undefined)}
      >
        {icon}
        {children}
      </NavLink>
    </li>
  );
}

export function SideNav({ did, avatarUrl, handle, isAdmin }: Props) {
  const profileId = handle === "handle.invalid" ? did : handle;

  return (
    <nav className="flex h-full flex-col">
      <div className="p-4 text-lg font-bold text-primary">Subscope</div>
      <ul className="menu w-full flex-1">
        <NavItem to="/" icon={<HomeIcon className="size-4" />}>
          ホーム
        </NavItem>
        <NavItem to="/search" icon={<SearchIcon className="size-4" />}>
          検索
        </NavItem>
        <NavItem to="/members" icon={<UsersIcon className="size-4" />}>
          メンバー
        </NavItem>
        <NavItem to="/tracked-actors" icon={<RadarIcon className="size-4" />}>
          追跡中のユーザー
        </NavItem>
        {profileId ? (
          <NavItem
            to={`/profile/${profileId}`}
            icon={<CircleUserIcon className="size-4" />}
          >
            プロフィール
          </NavItem>
        ) : (
          <li>
            <a>
              <CircleUserIcon className="size-4" />
              プロフィール
            </a>
          </li>
        )}
        <li className="mt-2">
          <ComposeButton className="btn btn-primary">新規投稿</ComposeButton>
        </li>
        {isAdmin && (
          <li className="mt-auto">
            <h2 className="menu-title">サーバー管理</h2>
            <ul>
              <NavItem
                to="/admin/subscribers"
                icon={<UsersIcon className="size-4" />}
              >
                登録ユーザー
              </NavItem>
              <NavItem
                to="/admin/invite-codes"
                icon={<MailIcon className="size-4" />}
              >
                招待コード
              </NavItem>
              <li>
                <a href="/admin/bull-board" target="_blank" rel="noreferrer">
                  <ListIcon className="size-4" />
                  ジョブキュー
                  <ExternalLinkIcon
                    className="size-3.5"
                    aria-hidden
                    data-testid="external-link-icon"
                  />
                </a>
              </li>
            </ul>
          </li>
        )}
      </ul>
      <div className="flex items-center gap-2 border-t border-base-300 p-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="size-8 rounded-full bg-base-300" />
        )}
        {handle && (
          <span className="min-w-0 flex-1 truncate text-sm">@{handle}</span>
        )}
        <div className="dropdown dropdown-end dropdown-top ml-auto">
          <button
            type="button"
            className="btn btn-square btn-ghost btn-sm"
            aria-label="アカウントメニュー"
          >
            <EllipsisIcon className="size-4" />
          </button>
          <ul
            className="
              menu dropdown-content z-10 w-40 rounded-box border border-base-300
              bg-base-100 p-2 shadow-sm
            "
          >
            <li>
              <button type="submit" form="logout-form">
                <LogOutIcon className="size-4" />
                ログアウト
              </button>
            </li>
          </ul>
          <Form id="logout-form" method="post" action="/oauth/logout" />
        </div>
      </div>
    </nav>
  );
}
