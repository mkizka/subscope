import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AdminSidebarContainer } from "@/app/features/admin/blocks/admin-sidebar-container";
import { AdminHeader } from "@/app/features/admin/parts/admin-header";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebarContainer />
      <SidebarInset>
        <AdminHeader />
        <div className="flex justify-center p-4">
          <div className="w-full max-w-4xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
