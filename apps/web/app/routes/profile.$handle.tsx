import { loginRequiredMiddleware } from "@/app/middlewares/auth";
import { ProfilePage } from "@/app/pages/client/profile-page";

import type { Route } from "./+types/profile.$handle";

export const middleware: Route.MiddlewareFunction[] = [loginRequiredMiddleware];

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.handle} - Subscope` }];
}

export default function Profile({ params }: Route.ComponentProps) {
  return <ProfilePage handle={params.handle} />;
}
