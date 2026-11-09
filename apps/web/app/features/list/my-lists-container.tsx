import { useRef } from "react";

import { ListsSkeleton } from "@/app/components/rows-skeleton";
import { Button } from "@/app/components/ui/button";
import { useMe } from "@/app/features/navigation/side-nav-container";

import { ListForm } from "./list-form";
import { ListsContainer } from "./lists-container";

export function MyListsContainer() {
  const me = useMe();
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <header className="flex items-center justify-between border-b border-line p-4">
        <h1 className="text-title">リスト</h1>
        <Button size="sm" onClick={() => ref.current?.showModal()}>
          新しいリスト
        </Button>
      </header>
      <ListForm ref={ref} title="新しいリスト" submitLabel="作成する" />
      {me?.profileId ? (
        <ListsContainer handle={me.profileId} />
      ) : (
        <ListsSkeleton />
      )}
    </>
  );
}
