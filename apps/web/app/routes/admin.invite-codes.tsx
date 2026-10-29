import getInviteCodes from "@repo/client/lex/me/subsco/admin/getInviteCodes";

import { agentContext } from "@/app/context/agent";
import { InviteCodesPage } from "@/app/pages/admin/invite-codes-page";

import type { Route } from "./+types/admin.invite-codes";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const agent = context.get(agentContext);
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  return agent.call(getInviteCodes, { limit: 20, cursor });
};

export default function AdminInviteCodes({ loaderData }: Route.ComponentProps) {
  return (
    <InviteCodesPage codes={loaderData.codes} cursor={loaderData.cursor} />
  );
}
