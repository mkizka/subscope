import { clsx } from "clsx";

import { Avatar } from "@/app/components/ui/avatar";
import { buttonClass } from "@/app/components/ui/button";
import { ComposeButton } from "@/app/features/post/post-form-container";

import { AdminNavMenu, NavMenu } from "./nav-menu";

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
      </div>
    </nav>
  );
}
