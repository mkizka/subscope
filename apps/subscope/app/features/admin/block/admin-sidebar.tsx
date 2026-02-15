import { TicketIcon } from "lucide-react";

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

const menuItems = [{ title: "招待コード", icon: TicketIcon, href: "/admin" }];

export function AdminSidebar() {
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
                <SidebarNavItem key={item.title} isActive {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
