import { BellIcon, MenuIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SideNavContainer } from "@/app/features/navigation/blocks/side-nav-container";
import { NotificationPanel } from "@/app/features/notification/blocks/notification-panel";

type Props = {
  children: ReactNode;
};

export const ThreeColumnLayout = ({ children }: Props) => {
  return (
    <div
      className="
        drawer
        lg:drawer-open
      "
    >
      <input id="side-nav-drawer" type="checkbox" className="drawer-toggle" />
      <div
        className="
          drawer-content flex min-h-screen bg-base-100 text-base-content
        "
      >
        <main className="min-w-0 flex-1">
          <header
            className="
              navbar sticky top-0 z-10 border-b border-base-300 bg-base-100
              lg:hidden
            "
          >
            <label
              htmlFor="side-nav-drawer"
              aria-label="メニューを開く"
              className="btn btn-square btn-ghost"
            >
              <MenuIcon />
            </label>
            <div className="flex-1 font-bold text-primary">Subscope</div>
            <label
              htmlFor="notification-toggle"
              aria-label="通知を開く"
              className="btn btn-square btn-ghost"
            >
              <BellIcon />
            </label>
          </header>
          {children}
        </main>
        <input
          id="notification-toggle"
          type="checkbox"
          className="peer hidden"
        />
        <aside
          className="
            hidden overflow-y-auto border-base-300
            max-lg:peer-checked:fixed max-lg:peer-checked:inset-0
            max-lg:peer-checked:z-20 max-lg:peer-checked:block
            max-lg:peer-checked:bg-base-100
            lg:sticky lg:top-0 lg:block lg:h-screen lg:w-80 lg:shrink-0
            lg:border-l
          "
        >
          <label
            htmlFor="notification-toggle"
            aria-label="通知を閉じる"
            className="
              btn m-2 btn-square btn-ghost
              lg:hidden
            "
          >
            <XIcon />
          </label>
          <NotificationPanel />
        </aside>
      </div>
      <div className="drawer-side z-30">
        <label
          htmlFor="side-nav-drawer"
          aria-label="メニューを閉じる"
          className="drawer-overlay"
        />
        <aside className="h-full w-60 border-r border-base-300 bg-base-200">
          <SideNavContainer />
        </aside>
      </div>
    </div>
  );
};
