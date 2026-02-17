import { HomePage } from "@/app/features/home/pages/home";

export function meta() {
  return [
    { title: "Subscope - 省ストレージなBluesky互換Appview" },
    {
      name: "description",
      content: "Tapを利用して省ストレージを目指したBluesky互換のAppview",
    },
  ];
}

export default function Home() {
  return <HomePage />;
}
