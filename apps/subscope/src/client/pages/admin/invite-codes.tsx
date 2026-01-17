import { AccessControlContainer } from "../../features/admin/access-control/container";
import { InviteCodesContainer } from "../../features/admin/invite-codes/container";
import { AdminLayout } from "../../features/admin/layout";

export function AdminInviteCodes() {
  return (
    <AccessControlContainer>
      <AdminLayout title="招待コード管理">
        <InviteCodesContainer />
      </AdminLayout>
    </AccessControlContainer>
  );
}
