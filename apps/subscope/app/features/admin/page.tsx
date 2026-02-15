import { InviteCodeTableContainer } from "./block/invite-code-table-container";

export function AdminPage() {
  return (
    <div className="flex size-full justify-center">
      <div className="w-full max-w-4xl p-4">
        <InviteCodeTableContainer />
      </div>
    </div>
  );
}
