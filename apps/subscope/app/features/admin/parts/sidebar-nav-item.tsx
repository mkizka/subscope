import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";

type Props = {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  reload?: boolean;
};

export function SidebarNavItem({
  title,
  href,
  icon: Icon,
  isActive,
  reload,
}: Props) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        render={<Link to={href} reloadDocument={reload} />}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
