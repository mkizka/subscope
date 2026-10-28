import type { ReactNode } from "react";

import { SideNavContainer } from "@/app/features/navigation/blocks/side-nav-container";
import { NotificationPanel } from "@/app/features/notification/blocks/notification-panel";

type Props = {
  children: ReactNode;
};

export const ThreeColumnLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <aside
        className="
          sticky top-0 h-screen w-60 shrink-0 border-r border-base-300
          bg-base-200
        "
      >
        <SideNavContainer />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
      <aside
        className="
          sticky top-0 h-screen w-80 shrink-0 overflow-y-auto border-l
          border-base-300
        "
      >
        <NotificationPanel />
      </aside>
    </div>
  );
};
