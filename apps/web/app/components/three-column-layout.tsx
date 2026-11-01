import type { ReactNode } from "react";

import { BottomTabsContainer } from "@/app/features/navigation/blocks/bottom-tabs-container";
import { MobileHeaderContainer } from "@/app/features/navigation/blocks/mobile-header-container";
import { SideNavContainer } from "@/app/features/navigation/blocks/side-nav-container";
import { ServerAbout } from "@/app/features/navigation/parts/server-about";
import { ComposeButton } from "@/app/features/timeline/blocks/post-form-container";

type Props = {
  children: ReactNode;
};

export const ThreeColumnLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen justify-center bg-surface text-ink">
      <aside
        className="
          hidden w-60 shrink-0 border-r border-line
          lg:sticky lg:top-0 lg:block lg:h-screen
        "
      >
        <SideNavContainer />
      </aside>
      <main
        className="
          w-full max-w-main min-w-0 pb-16
          lg:pb-0
        "
      >
        <MobileHeaderContainer />
        {children}
        <ComposeButton
          className="
            fixed right-4 bottom-20 z-10 flex size-14 items-center
            justify-center rounded-full bg-brand text-on-brand shadow-lg
            hover:opacity-90
            lg:hidden
          "
        />
        <BottomTabsContainer />
      </main>
      <aside
        aria-label="このサーバーについて"
        className="
          hidden border-line p-4
          lg:sticky lg:top-0 lg:block lg:h-screen lg:w-80 lg:shrink-0
          lg:border-l
        "
      >
        <ServerAbout />
      </aside>
    </div>
  );
};
