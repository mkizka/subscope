import { didContext } from "@/app/context/did";
import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { SettingsPage } from "@/app/pages/client/settings-page";
import { di } from "@/app/server/di";

import type { Route } from "./+types/settings";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export const loader = async ({ context }: Route.LoaderArgs) => {
  return {
    accountUrl: await di.oauthClient.getAccountUrl(context.get(didContext)),
  };
};

export function meta() {
  return [{ title: "設定 - Subscope" }];
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  return <SettingsPage accountUrl={loaderData.accountUrl} />;
}
