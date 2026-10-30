import { Client } from "@atproto/lex";
import getMembers from "@repo/client/lex/me/subsco/server/getMembers";
import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { MembersPage } from "@/app/pages/client/members-page";
import { env } from "@/app/shared/env";

import type { Route } from "./+types/members";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async () => {
  const client = new Client(env.APPVIEW_URL);
  // ponytail: 最初の100件のみ。続きの読み込みはcursorを使うAPIルートを足すとき
  const { members } = await client.call(getMembers, { limit: 100 });
  return data({
    members: members.map(({ profile, isAdmin }) => ({
      did: profile.did,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatar,
      isAdmin,
    })),
  });
};

export function meta() {
  return [{ title: "メンバー - Subscope" }];
}

export default function Members({ loaderData }: Route.ComponentProps) {
  return <MembersPage members={loaderData.members} />;
}
