import { clsx } from "clsx";
import { EllipsisIcon, LogOutIcon } from "lucide-react";
import { Form } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { buttonClass } from "@/app/components/ui/button";
import { Menu, menuItemClass } from "@/app/components/ui/menu";
import {
  AdminNavMenu,
  NavMenu,
} from "@/app/features/navigation/parts/nav-menu";
import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  profileId?: string;
  avatarUrl?: string;
  handle?: string;
  isAdmin?: boolean;
};

export function SideNav({ profileId, avatarUrl, handle, isAdmin }: Props) {
  return (
    <nav className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center gap-2 px-3 text-title">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          className="size-8"
        />
        Subscope
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <NavMenu profileId={profileId} />
        <ComposeButton className={clsx(buttonClass(), "w-full")}>
          新規投稿
        </ComposeButton>
        {isAdmin && (
          <div className="mt-auto">
            <AdminNavMenu />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Avatar src={avatarUrl} size="sm" />
        {handle && (
          <span className="min-w-0 flex-1 truncate text-label text-muted">
            @{handle}
          </span>
        )}
        <Menu
          label="アカウントメニュー"
          placement="top"
          trigger={<EllipsisIcon className="size-4" />}
        >
          <button type="submit" form="logout-form" className={menuItemClass}>
            <LogOutIcon className="size-4" />
            ログアウト
          </button>
        </Menu>
        <Form id="logout-form" method="post" action="/oauth/logout" />
      </div>
    </nav>
  );
}
