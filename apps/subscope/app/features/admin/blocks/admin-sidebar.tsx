import type { LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/app/components/ui/sidebar";
import { SidebarNavItem } from "@/app/features/admin/parts/sidebar-nav-item";

type MenuItem = {
  title: string;
  icon: LucideIcon;
  href: string;
  reload?: boolean;
};

type Props = {
  menuItems: MenuItem[];
  currentPath: string;
};

export function AdminSidebar({ menuItems, currentPath }: Props) {
  return (
    <Sidebar>
      <SidebarHeader>
        <span className="px-2 text-lg font-semibold">管理画面</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  isActive={currentPath === item.href}
                  {...item}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
