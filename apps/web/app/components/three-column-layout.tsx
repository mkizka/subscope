import { clsx } from "clsx";
import { MenuIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router";

import { SideNavContainer } from "@/app/features/navigation/blocks/side-nav-container";
import { NotificationBellContainer } from "@/app/features/notification/blocks/notification-bell-container";
import { NotificationPanelContainer } from "@/app/features/notification/blocks/notification-panel-container";
import { ThreadPanelContainer } from "@/app/features/thread/blocks/thread-panel-container";
import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  children: ReactNode;
};

export const ThreeColumnLayout = ({ children }: Props) => {
  const [searchParams] = useSearchParams();
  const thread = searchParams.get("thread");

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
        <input
          id="notification-toggle"
          type="checkbox"
          className="peer hidden"
        />
        <aside
          className={clsx(
            `
              hidden overflow-y-auto border-base-300
              max-lg:peer-checked:fixed max-lg:peer-checked:inset-0
              max-lg:peer-checked:z-20 max-lg:peer-checked:block
              max-lg:peer-checked:bg-base-100
              lg:sticky lg:top-0 lg:block lg:h-screen lg:w-80 lg:shrink-0
              lg:border-l
            `,
            thread &&
              `
                max-lg:fixed max-lg:inset-0 max-lg:z-20 max-lg:block
                max-lg:bg-base-100
              `,
          )}
        >
          {thread ? (
            <ThreadPanelContainer uri={thread} />
          ) : (
            <>
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
              <NotificationPanelContainer />
            </>
          )}
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
