import { data } from "react-router";

import { expressContext } from "@/app/context/express";
import { HomePage } from "@/app/features/home/pages/home";
import { TimelinePage } from "@/app/features/timeline/pages/timeline";

import type { Route } from "./+types/_index";

export function meta() {
  return [
    { title: "Subscope - 省ストレージなBluesky互換Appview" },
    {
      name: "description",
      content: "Tapを利用して省ストレージを目指したBluesky互換のAppview",
    },
  ];
}

export const loader = ({ context }: Route.LoaderArgs) => {
  const server = context.get(expressContext);
  return data({ isLoggedIn: server.agent !== null });
};

export default function Home({ loaderData }: Route.ComponentProps) {
  if (loaderData.isLoggedIn) {
    return <TimelinePage />;
  }
  return <HomePage />;
}
