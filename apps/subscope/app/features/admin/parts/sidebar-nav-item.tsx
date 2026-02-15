import type { LucideIcon } from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";

type Props = {
  title: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
};

export function SidebarNavItem({ title, href, icon: Icon, isActive }: Props) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} render={<a href={href} />}>
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
