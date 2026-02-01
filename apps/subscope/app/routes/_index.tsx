import { Button } from "@/components/ui/button";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const loader = ({ context }: Route.LoaderArgs) => {
  return {
    did: context.auth?.userDid || null,
  };
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { did } = loaderData;
  return (
    <div>
      <h1>home</h1>
      <p>Your DID: {did ?? "not logged in"}</p>
      <Button>Button</Button>
    </div>
  );
}
