import type { ComponentProps, ReactNode } from "react";
import { Link, redirect } from "react-router";

import { HeaderCard } from "~/components/header-card";
import { oauthSession } from "~/server/inject";

import type { Route } from "./+types/_index";

export async function loader({ request }: Route.LoaderArgs) {
  const agent = await oauthSession.getAgent(request);

  if (!agent) {
    return redirect("/login");
  }

  return {
    userDid: agent.did,
  };
}

function LinkCard({
  to,
  children,
}: {
  to: ComponentProps<typeof Link>["to"];
  children: ReactNode;
}) {
  return (
    <Link
      className="card bg-base-100 w-full shadow-sm hover:bg-base-200"
      to={to}
    >
      <div className="card-body items-center">{children}</div>
    </Link>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <HeaderCard className="col-span-2" />
      <LinkCard to="/invite-codes">
        <span className="icon-[tabler--ticket] size-10"></span>
        招待コード
      </LinkCard>
      <LinkCard to="/subscribers">
        <span className="icon-[tabler--user] size-10"></span>
        サブスクライバー
      </LinkCard>
    </div>
  );
}
