import { DashboardContainer } from "../../features/admin/dashboard/container";
import { AdminLayout } from "../../features/admin/layout";

export function AdminDashboard() {
  return (
    <AdminLayout title="ダッシュボード">
      <DashboardContainer />
    </AdminLayout>
  );
}
