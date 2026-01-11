import type { ComponentChildren } from "preact";

import { cn } from "../utils/cn";

type SidebarProps = {
  children: ComponentChildren;
  className?: string;
};

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-64 flex-col bg-surface-container-low p-6",
        "border-r border-outline-variant",
        className,
      )}
    >
      {children}
    </aside>
  );
}

type SidebarHeaderProps = {
  children: ComponentChildren;
  className?: string;
};

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div
      className={cn("mb-8 flex justify-center items-center gap-3", className)}
    >
      {children}
    </div>
  );
}

type SidebarNavProps = {
  children: ComponentChildren;
  className?: string;
};

export function SidebarNav({ children, className }: SidebarNavProps) {
  return (
    <nav className={cn("flex-1 space-y-1 w-full", className)}>{children}</nav>
  );
}

type SidebarNavItemProps = {
  children: ComponentChildren;
  icon: ComponentChildren;
  active?: boolean;
  onClick?: () => void;
};

export function SidebarNavItem({
  children,
  icon,
  active,
  onClick,
}: SidebarNavItemProps) {
  const Element = onClick ? "button" : "div";
  const props = onClick ? { type: "button" as const, onClick } : {};

  return (
    <Element
      {...props}
      className={cn(
        "flex w-full items-center justify-start gap-4 h-12 rounded-full px-6",
        "transition-all duration-200 ease-out",
        active
          ? "bg-secondary-container text-on-secondary-container hover:shadow-elevation-1"
          : "text-on-surface hover:bg-surface-container-highest",
      )}
    >
      {icon}
      <span className={active ? "font-semibold" : "font-normal"}>
        {children}
      </span>
    </Element>
  );
}

type SidebarFooterProps = {
  children: ComponentChildren;
  className?: string;
};

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div
      className={cn("mt-auto pt-4 border-t border-outline-variant", className)}
    >
      {children}
    </div>
  );
}
