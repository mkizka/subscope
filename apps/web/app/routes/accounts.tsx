import { redirect } from "react-router";

import type { Route } from "./+types/accounts";

export const loader = ({ request }: Route.LoaderArgs) =>
  redirect(`/server/accounts${new URL(request.url).search}`);
