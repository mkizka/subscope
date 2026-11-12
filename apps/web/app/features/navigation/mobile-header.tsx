import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/app/components/ui/avatar";

import { AdminNavMenu, NavMenu } from "./nav-menu";

type Props = {
  avatarUrl?: string;
  profileId?: string;
  isAdmin?: boolean;
};

function useScrollingUp() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 8) return;
      setVisible(y < last || y < 56);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}

export function MobileHeader({ avatarUrl, profileId, isAdmin }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  const visible = useScrollingUp();

  return (
    <header
      data-visible={visible}
      className="
        sticky top-0 z-sticky grid h-14 grid-cols-3 items-center border-b
        border-line bg-surface px-4 transition-[top]
        data-[visible=false]:-top-14
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
      <img
        src={`${import.meta.env.BASE_URL}favicon.svg`}
        alt="Subscope"
        className="mx-auto size-8"
      />
      <dialog
        ref={ref}
        aria-label="メニュー"
        className="
          m-0 h-full max-h-none w-72 bg-surface p-4 text-ink
          backdrop:bg-black/40
        "
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <nav className="flex flex-col gap-3">
          <NavMenu profileId={profileId} onNavigate={close} />
          {isAdmin && <AdminNavMenu onNavigate={close} />}
        </nav>
      </dialog>
    </header>
  );
}
