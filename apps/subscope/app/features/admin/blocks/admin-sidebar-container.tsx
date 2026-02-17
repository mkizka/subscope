import { LayoutDashboardIcon, TicketIcon } from "lucide-react";
import { useLocation } from "react-router";

import { AdminSidebar } from "./admin-sidebar";

const menuItems = [
  { title: "招待コード", icon: TicketIcon, href: "/admin" },
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
