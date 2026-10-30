import { didContext } from "@/app/context/did";
import { InviteCodesPage } from "@/app/pages/admin/invite-codes-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/admin.invite-codes";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const did = context.get(didContext);
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  return di.getInviteCodesUseCase(did, cursor);
};

export default function AdminInviteCodes({ loaderData }: Route.ComponentProps) {
  return (
    <InviteCodesPage codes={loaderData.codes} cursor={loaderData.cursor} />
  );
}
