import { data } from "react-router";
import { z } from "zodV4";

import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { di } from "@/app/server/di";

import type { Route } from "./+types/api.push-subscription";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

// workerがメンバーの指定した任意のURLへ送らないよう、本番ではhttpsに限る
const endpointSchema = z
  .url()
  .max(2048)
  .refine((value) => !di.isProduction || value.startsWith("https://"));

const subscriptionSchema = z.object({
  endpoint: endpointSchema,
  keys: z.object({ p256dh: z.string().max(256), auth: z.string().max(256) }),
});

export const loader = () => {
  return data({ publicKey: di.vapidPublicKey ?? null });
};

export const action = async ({ request, context }: Route.ActionArgs) => {
  const did = context.get(didContext);
  if (request.method === "POST") {
    const { endpoint, keys } = subscriptionSchema.parse(await request.json());
    await di.subscribePushUseCase.execute(did, { endpoint, ...keys });
    return data({ success: true });
  }
  if (request.method === "DELETE") {
    const { endpoint } = z
      .object({ endpoint: endpointSchema })
      .parse(await request.json());
    await di.unsubscribePushUseCase.execute(did, endpoint);
    return data({ success: true });
  }
  throw data(null, { status: 405 });
};
