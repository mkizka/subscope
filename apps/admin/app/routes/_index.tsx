import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    message: context.VALUE_FROM_EXPRESS,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <p>{loaderData.message}</p>;
}
