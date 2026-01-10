import type { ComponentChildren } from "preact";
import { useLocation } from "preact-iso";

import { Avatar, AvatarFallback } from "../../components/avatar";
import { CloudIcon, HomeIcon, KeyIcon } from "../../components/icons";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
} from "../../components/sidebar";
import { cn } from "../../utils/cn";

type AdminLayoutProps = {
  children: ComponentChildren;
  title: string;
};

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { url } = useLocation();

  return (
    <div className="flex h-screen bg-surface-container">
      <Sidebar>
        <SidebarHeader>
          <CloudIcon className="h-7 w-7 text-primary" />
          <span className="text-xl font-medium text-on-surface">Sky Admin</span>
        </SidebarHeader>

        <SidebarNav>
          <a href="/admin" className="no-underline">
            <SidebarNavItem
              icon={<HomeIcon className="h-5 w-5" />}
              active={url === "/admin" || url === "/admin/"}
            >
              ダッシュボード
            </SidebarNavItem>
          </a>
          <a href="/admin/invite-codes" className="no-underline">
            <SidebarNavItem
              icon={<KeyIcon className="h-5 w-5" />}
              active={url.startsWith("/admin/invite-codes")}
            >
              招待コード
            </SidebarNavItem>
          </a>
        </SidebarNav>

        <SidebarFooter>
          <a
            href="/"
            className={cn(
              "flex w-full items-center justify-start gap-4 h-12 rounded-full px-6",
              "text-on-surface hover:bg-surface-container-highest",
              "transition-all duration-200 no-underline",
            )}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="font-normal">クライアントに戻る</span>
          </a>
        </SidebarFooter>

        <div className="mt-4 px-2">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-surface-container-highest transition-all duration-200 cursor-pointer">
            <Avatar className="h-10 w-10 border border-outline-variant">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">
                管理者
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                @admin.bsky
              </p>
            </div>
          </div>
        </div>
      </Sidebar>

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="border-b border-outline-variant px-6 py-0 bg-surface/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="h-16 flex items-center">
            <h1 className="text-2xl font-medium text-on-surface">{title}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
