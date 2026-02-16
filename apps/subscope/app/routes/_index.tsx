import { Link } from "react-router";

import { AppLayout } from "@/app/components/layout";
import { Button } from "@/app/components/ui/button";
import { expressContext } from "@/app/context/express";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const loader = ({ context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);
  return {
    did: server.agent?.did,
  };
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { did } = loaderData;
  return (
    <AppLayout>
      <h1>home</h1>
      <p>Your DID: {did ?? "not logged in"}</p>
      <Button nativeButton={false} render={<Link to="/login">ログイン</Link>} />
    </AppLayout>
  );
}
