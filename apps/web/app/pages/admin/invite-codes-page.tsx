import type { InviteCode } from "@/app/features/admin/blocks/invite-code-list";
import { InviteCodeListContainer } from "@/app/features/admin/blocks/invite-code-list-container";

type Props = {
  codes: InviteCode[];
  cursor?: string;
};

export function InviteCodesPage({ codes, cursor }: Props) {
  return <InviteCodeListContainer codes={codes} cursor={cursor} />;
}
