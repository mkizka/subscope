import { MenuIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SideNavContainer } from "@/app/features/navigation/blocks/side-nav-container";
import { NotificationBellContainer } from "@/app/features/notification/blocks/notification-bell-container";
import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

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
            <NotificationBellContainer />
          </header>
          {children}
          <ComposeButton
            className="
              btn fixed right-4 bottom-4 z-10 btn-circle btn-lg btn-primary
              lg:hidden
            "
          />
        </main>
        <aside
          className="
            hidden border-base-300 p-4 text-sm
            lg:sticky lg:top-0 lg:block lg:h-screen lg:w-80 lg:shrink-0
            lg:border-l
          "
        >
          <h2 className="font-bold">このサーバーについて</h2>
          <p className="mt-2 text-base-content/70">
            Blueskyのアカウントで使える招待制のサーバーです。メンバーとそのフォロー先の投稿だけを保存します。
          </p>
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
