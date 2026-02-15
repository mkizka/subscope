import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";

import { AdminSidebarContainer } from "./block/admin-sidebar-container";
import { InviteCodeTableContainer } from "./block/invite-code-table-container";
import { AdminHeader } from "./parts/admin-header";

export function AdminPage() {
  return (
    <SidebarProvider>
      <AdminSidebarContainer />
      <SidebarInset>
        <AdminHeader />
        <div className="flex justify-center p-4">
          <div className="w-full max-w-4xl">
            <InviteCodeTableContainer />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
