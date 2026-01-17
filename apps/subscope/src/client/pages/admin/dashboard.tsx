import { AccessControlContainer } from "../../features/admin/access-control/container";
import { DashboardContainer } from "../../features/admin/dashboard/container";
import { AdminLayout } from "../../features/admin/layout";

export function AdminDashboard() {
  return (
    <AccessControlContainer>
      <AdminLayout title="ダッシュボード">
        <DashboardContainer />
      </AdminLayout>
    </AccessControlContainer>
  );
}
