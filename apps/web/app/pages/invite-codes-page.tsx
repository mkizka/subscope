import type { InviteCode } from "@/app/features/admin/blocks/invite-code-table";
import { InviteCodeTableContainer } from "@/app/features/admin/blocks/invite-code-table-container";

type Props = {
  codes: InviteCode[];
  cursor?: string;
};

export function InviteCodesPage({ codes, cursor }: Props) {
  return <InviteCodeTableContainer codes={codes} cursor={cursor} />;
}
