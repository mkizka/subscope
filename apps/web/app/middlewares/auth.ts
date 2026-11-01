import { createHash, timingSafeEqual } from "node:crypto";

import verifyAccess from "@repo/client/lex/me/subsco/admin/verifyAccess";
import { data, redirect, type RouterContextProvider } from "react-router";

import { didContext } from "@/app/context/did";
import { di } from "@/app/server/di";
import { env } from "@/app/server/env";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

const canReadBullBoardWithToken = (request: Request) => {
  const authorization = request.headers.get("Authorization");
  return (
    env.ADMIN_API_TOKEN !== undefined &&
    authorization !== null &&
    request.method === "GET" &&
    new URL(request.url).pathname.startsWith("/admin/bull-board/api/") &&
    timingSafeEqual(
      sha256(authorization),
      sha256(`Bearer ${env.ADMIN_API_TOKEN}`),
    )
  );
};

export const getAgent = async (request: Request) => {
  const did = await di.cookieSessionStorage.getDid(
    request.headers.get("Cookie"),
  );
  return did ? di.oauthClient.restore(did) : null;
};

export const loginRequiredMiddleware = async ({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) => {
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  context.set(didContext, agent.assertDid);
};

export const adminRequiredMiddleware = async ({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) => {
  if (canReadBullBoardWithToken(request)) {
    return;
  }
  const agent = await getAgent(request);
  if (!agent) {
    throw redirect("/login");
  }
  const response = await agent.call(verifyAccess);
  if (response.status !== "authorized") {
    throw data("ログイン中のアカウントが管理者ではありません", { status: 403 });
  }
  context.set(didContext, agent.assertDid);
};
