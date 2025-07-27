import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  return {
    message: context.VALUE_FROM_EXPRESS,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <p>{loaderData.message}</p>;
}
