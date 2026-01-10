import { InviteCodesContainer } from "../../features/admin/invite-codes/container";
import { AdminLayout } from "../../features/admin/layout";

export function AdminInviteCodes() {
  return (
    <AdminLayout title="招待コード管理">
      <InviteCodesContainer />
    </AdminLayout>
  );
}
