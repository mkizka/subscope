import { ListsContainer } from "@/app/features/list/lists-container";

import type { Route } from "./+types/$handle.lists";

export function meta() {
  return [{ title: "リスト - Subscope" }];
}

export default function Lists({ params }: Route.ComponentProps) {
  return <ListsContainer handle={params.handle} />;
}
