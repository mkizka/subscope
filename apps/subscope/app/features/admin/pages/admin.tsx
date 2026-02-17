import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AdminSidebarContainer } from "@/app/features/admin/blocks/admin-sidebar-container";
import { InviteCodeTableContainer } from "@/app/features/admin/blocks/invite-code-table-container";
import { AdminHeader } from "@/app/features/admin/parts/admin-header";

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
