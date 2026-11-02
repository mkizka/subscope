import {
  BellIcon,
  CircleUserIcon,
  ExternalLinkIcon,
  HomeIcon,
  ListIcon,
  ListTodoIcon,
  MailIcon,
  RadarIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";

export const navItemClass = `
  flex items-center gap-3 rounded-xl px-3 py-2 text-body
  hover:bg-surface-2
`;

function Item({
  to,
  icon,
  children,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `${navItemClass} ${isActive ? "bg-surface-2 font-bold" : ""}`
        }
      >
        {icon}
        {children}
      </NavLink>
    </li>
  );
}

export function NavMenu({
  profileId,
  onNavigate,
}: {
  profileId?: string;
  onNavigate?: () => void;
}) {
  const p = { onNavigate };
  return (
    <ul className="flex flex-col gap-1">
      <Item to="/" icon={<HomeIcon className="size-6" />} {...p}>
        ホーム
      </Item>
      <Item to="/search" icon={<SearchIcon className="size-6" />} {...p}>
        検索
      </Item>
      <Item to="/notifications" icon={<BellIcon className="size-6" />} {...p}>
        通知
      </Item>
      <Item
        to="/registered-accounts"
        icon={<UsersIcon className="size-6" />}
        {...p}
      >
        登録アカウント
      </Item>
      <Item
        to="/tracked-accounts"
        icon={<RadarIcon className="size-6" />}
        {...p}
      >
        追跡アカウント
      </Item>
      {profileId && (
        <>
          <Item
            to={`/profile/${profileId}/lists`}
            icon={<ListIcon className="size-6" />}
            {...p}
          >
            リスト
          </Item>
          <Item
            to={`/profile/${profileId}`}
            icon={<CircleUserIcon className="size-6" />}
            {...p}
          >
            プロフィール
          </Item>
        </>
      )}
    </ul>
  );
}

export function AdminNavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const p = { onNavigate };
  return (
    <section>
      <h2 className="px-3 py-2 text-caption text-muted">サーバー管理</h2>
      <ul className="flex flex-col gap-1">
        <Item
          to="/admin/registered-accounts"
          icon={<UsersIcon className="size-6" />}
          {...p}
        >
          アカウント管理
        </Item>
        <Item
          to="/admin/invite-codes"
          icon={<MailIcon className="size-6" />}
          {...p}
        >
          招待コード
        </Item>
        <li>
          <a
            href="/admin/bull-board"
            target="_blank"
            rel="noreferrer"
            className={navItemClass}
          >
            <ListTodoIcon className="size-6" />
            ジョブキュー
            <ExternalLinkIcon
              className="size-4"
              aria-hidden
              data-testid="external-link-icon"
            />
          </a>
        </li>
      </ul>
    </section>
  );
}
