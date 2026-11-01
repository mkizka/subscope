import { ListIcon, LogOutIcon, ShieldIcon, UsersIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Form, Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { ServerAbout } from "@/app/features/navigation/parts/server-about";

type Props = {
  avatarUrl?: string;
  profileId?: string;
  isAdmin?: boolean;
};

export function MobileHeader({ avatarUrl, profileId, isAdmin }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  const item = (to: string, icon: ReactNode, label: string) => (
    <Link
      to={to}
      onClick={close}
      className="
        flex items-center gap-3 rounded-xl px-3 py-2 text-body
        hover:bg-surface-2
      "
    >
      {icon}
      {label}
    </Link>
  );

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
        <nav className="mt-4 flex flex-col border-t border-line pt-4">
          {profileId &&
            item(
              `/profile/${profileId}/lists`,
              <ListIcon className="size-6" />,
              "リスト",
            )}
          {item("/members", <UsersIcon className="size-6" />, "メンバー")}
          {isAdmin &&
            item(
              "/admin/subscribers",
              <ShieldIcon className="size-6" />,
              "サーバー管理",
            )}
          <Form method="post" action="/oauth/logout">
            <button
              type="submit"
              className="
                flex w-full items-center gap-3 rounded-xl px-3 py-2 text-body
                hover:bg-surface-2
              "
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
