import { LayoutDashboardIcon, TicketIcon, UsersIcon } from "lucide-react";
import { useLocation } from "react-router";

import { AdminSidebar } from "./admin-sidebar";

const menuItems = [
  { title: "招待コード", icon: TicketIcon, href: "/admin" },
  { title: "登録アカウント", icon: UsersIcon, href: "/admin/subscribers" },
  {
    title: "Bull Board",
    icon: LayoutDashboardIcon,
    href: "/admin/bull-board",
    reload: true,
  },
];

export function AdminSidebarContainer() {
  const { pathname } = useLocation();
  return <AdminSidebar menuItems={menuItems} currentPath={pathname} />;
}
