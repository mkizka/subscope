import { asDatetimeString } from "@atproto/syntax";
import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.notifications";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const cursor = new URL(request.url).searchParams.get("cursor") ?? undefined;
  return data(
    await di.getNotificationsUseCase.execute(context.get(didContext), cursor),
  );
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const { seenAt } = z
    .object({ seenAt: z.string().transform(asDatetimeString) })
    .parse(await request.json());
  await di.markNotificationsSeenUseCase.execute(
    context.get(didContext),
    seenAt,
  );
  return data({ success: true });
};
