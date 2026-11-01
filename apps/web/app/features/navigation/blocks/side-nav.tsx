import { clsx } from "clsx";
import {
  BellIcon,
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

import { Avatar } from "@/app/components/ui/avatar";
import { buttonClass } from "@/app/components/ui/button";
import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  profileId?: string;
  avatarUrl?: string;
  handle?: string;
  isAdmin?: boolean;
};

const itemClass = `
  flex items-center gap-3 rounded-xl px-3 py-2 text-body
  hover:bg-surface-2
`;

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
        className={({ isActive }) =>
          `${itemClass} ${isActive ? "bg-surface-2 font-bold" : ""}`
        }
      >
        {icon}
        {children}
      </NavLink>
    </li>
  );
}

export function SideNav({ profileId, avatarUrl, handle, isAdmin }: Props) {
  return (
    <nav className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center gap-2 px-3 text-title">
        <img src="/favicon.svg" alt="" className="size-8" />
        Subscope
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        <NavItem to="/" icon={<HomeIcon className="size-6" />}>
          ホーム
        </NavItem>
        <NavItem to="/search" icon={<SearchIcon className="size-6" />}>
          検索
        </NavItem>
        <NavItem to="/notifications" icon={<BellIcon className="size-6" />}>
          通知
        </NavItem>
        <NavItem to="/members" icon={<UsersIcon className="size-6" />}>
          メンバー
        </NavItem>
        <NavItem to="/tracked-actors" icon={<RadarIcon className="size-6" />}>
          追跡中のユーザー
        </NavItem>
        {profileId ? (
          <NavItem
            to={`/profile/${profileId}`}
            icon={<CircleUserIcon className="size-6" />}
          >
            プロフィール
          </NavItem>
        ) : (
          <li>
            <a className={itemClass}>
              <CircleUserIcon className="size-6" />
              プロフィール
            </a>
          </li>
        )}
        <li className="mt-2">
          <ComposeButton className={clsx(buttonClass(), "w-full")}>
            新規投稿
          </ComposeButton>
        </li>
        {isAdmin && (
          <li className="mt-auto">
            <h2 className="px-3 py-2 text-caption text-muted">サーバー管理</h2>
            <ul className="flex flex-col gap-1">
              <NavItem
                to="/admin/subscribers"
                icon={<UsersIcon className="size-6" />}
              >
                登録ユーザー
              </NavItem>
              <NavItem
                to="/admin/invite-codes"
                icon={<MailIcon className="size-6" />}
              >
                招待コード
              </NavItem>
              <li>
                <a
                  href="/admin/bull-board"
                  target="_blank"
                  rel="noreferrer"
                  className={itemClass}
                >
                  <ListIcon className="size-6" />
                  ジョブキュー
                  <ExternalLinkIcon
                    className="size-4"
                    aria-hidden
                    data-testid="external-link-icon"
                  />
                </a>
              </li>
            </ul>
          </li>
        )}
      </ul>
      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Avatar src={avatarUrl} size="sm" />
        {handle && (
          <span className="min-w-0 flex-1 truncate text-label text-muted">
            @{handle}
          </span>
        )}
        <button
          type="button"
          popoverTarget="account-menu"
          className={clsx(buttonClass({ variant: "ghost" }), "ml-auto")}
          aria-label="アカウントメニュー"
        >
          <EllipsisIcon className="size-4" />
        </button>
        <div
          id="account-menu"
          popover="auto"
          className="
            inset-auto bottom-20 left-4 w-40 rounded-xl border border-line
            bg-surface py-2 text-ink shadow-lg
          "
        >
          <button
            type="submit"
            form="logout-form"
            className="
              flex w-full items-center gap-2 px-4 py-2 text-label
              hover:bg-surface-2
            "
          >
            <LogOutIcon className="size-4" />
            ログアウト
          </button>
        </div>
        <Form id="logout-form" method="post" action="/oauth/logout" />
      </div>
    </nav>
  );
}
