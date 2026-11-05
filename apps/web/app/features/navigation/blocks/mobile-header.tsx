import { LogOutIcon } from "lucide-react";
import { useRef } from "react";
import { Form } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import {
  AdminNavMenu,
  navItemClass,
  NavMenu,
} from "@/app/features/navigation/parts/nav-menu";
import { ServerAbout } from "@/app/features/navigation/parts/server-about";

type Props = {
  avatarUrl?: string;
  profileId?: string;
  isAdmin?: boolean;
};

export function MobileHeader({ avatarUrl, profileId, isAdmin }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <header
      className="
        sticky top-0 z-10 grid h-14 grid-cols-3 items-center border-b
        border-line bg-surface px-4
        lg:hidden
      "
    >
      <button
        type="button"
        aria-label="メニューを開く"
        className="flex size-10 items-center justify-center"
        onClick={() => ref.current?.showModal()}
      >
        <Avatar src={avatarUrl} size="sm" />
      </button>
      <img src="/favicon.svg" alt="Subscope" className="mx-auto size-8" />
      <dialog
        ref={ref}
        aria-label="メニュー"
        className="
          m-0 h-full max-h-none w-72 bg-surface p-4 text-ink
          backdrop:bg-black/40
        "
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <ServerAbout />
        <nav className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <NavMenu profileId={profileId} onNavigate={close} showServer />
          {isAdmin && <AdminNavMenu onNavigate={close} />}
          <Form method="post" action="/oauth/logout">
            <button
              type="submit"
              className={`
                ${navItemClass}
                w-full
              `}
            >
              <LogOutIcon className="size-6" />
              ログアウト
            </button>
          </Form>
        </nav>
      </dialog>
    </header>
  );
}
