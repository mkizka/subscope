import { data } from "react-router";

import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ProfilePage } from "@/app/pages/client/profile-page";

import type { Route } from "./+types/$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function loader({ params }: Route.LoaderArgs) {
  if (!params.handle.includes(".") && !params.handle.startsWith("did:")) {
    throw data("ページが見つかりません", { status: 404 });
  }
  return null;
}

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.handle} - Subscope` }];
}

export default function Profile({ params }: Route.ComponentProps) {
  return <ProfilePage handle={params.handle} />;
}
