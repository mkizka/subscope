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

import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  profileId?: string;
  avatarUrl?: string;
  handle?: string;
  isAdmin?: boolean;
};

const itemClass = `
  flex items-center gap-3 rounded-xl px-3 py-2.5
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
    <nav className="flex h-full flex-col px-3.5 py-4">
      <div className="mx-1.5 mb-2 flex items-center gap-2 text-xl font-bold">
        <img src="/favicon.svg" alt="" className="size-7" />
        Subscope
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        <NavItem to="/" icon={<HomeIcon className="size-5" />}>
          ホーム
        </NavItem>
        <NavItem to="/search" icon={<SearchIcon className="size-5" />}>
          検索
        </NavItem>
        <NavItem to="/notifications" icon={<BellIcon className="size-5" />}>
          通知
        </NavItem>
        <NavItem to="/members" icon={<UsersIcon className="size-5" />}>
          メンバー
        </NavItem>
        <NavItem to="/tracked-actors" icon={<RadarIcon className="size-5" />}>
          追跡中のユーザー
        </NavItem>
        {profileId ? (
          <NavItem
            to={`/profile/${profileId}`}
            icon={<CircleUserIcon className="size-5" />}
          >
            プロフィール
          </NavItem>
        ) : (
          <li>
            <a className={itemClass}>
              <CircleUserIcon className="size-5" />
              プロフィール
            </a>
          </li>
        )}
        <li className="mt-2">
          <ComposeButton
            className="
              flex w-full items-center justify-center gap-2 rounded-full
              bg-brand py-3 font-bold text-on-brand
              hover:opacity-90
            "
          >
            新規投稿
          </ComposeButton>
        </li>
        {isAdmin && (
          <li className="mt-auto">
            <h2 className="px-3 py-2 text-xs text-muted">サーバー管理</h2>
            <ul className="flex flex-col gap-1">
              <NavItem
                to="/admin/subscribers"
                icon={<UsersIcon className="size-5" />}
              >
                登録ユーザー
              </NavItem>
              <NavItem
                to="/admin/invite-codes"
                icon={<MailIcon className="size-5" />}
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
                  <ListIcon className="size-5" />
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
      <div className="flex items-center gap-2 border-t border-line p-1.5 pt-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="size-8 rounded-full bg-line" />
        )}
        {handle && (
          <span className="min-w-0 flex-1 truncate text-sm text-muted">
            @{handle}
          </span>
        )}
        <button
          type="button"
          popoverTarget="account-menu"
          className="
            ml-auto rounded-full p-2
            hover:bg-surface-2
          "
          aria-label="アカウントメニュー"
        >
          <EllipsisIcon className="size-5" />
        </button>
        <div
          id="account-menu"
          popover="auto"
          className="
            inset-auto bottom-20 left-4 w-40 rounded-[14px] border border-line
            bg-surface p-1.5 text-ink
          "
        >
          <button
            type="submit"
            form="logout-form"
            className="
              flex w-full items-center gap-3 rounded-xl px-3 py-2
              hover:bg-surface-2
            "
          >
            <LogOutIcon className="size-5" />
            ログアウト
          </button>
        </div>
        <Form id="logout-form" method="post" action="/oauth/logout" />
      </div>
    </nav>
  );
}
