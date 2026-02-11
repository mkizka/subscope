import type { Route } from "./+types/dashboard._index";

export const action = async ({ request, context }: Route.ActionArgs) => {
  return context.dashboardHandler(request);
};

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  return context.dashboardHandler(request);
};
