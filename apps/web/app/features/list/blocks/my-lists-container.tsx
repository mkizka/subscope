import { LoadingSpinner } from "@/app/components/loading-spinner";
import { useMe } from "@/app/features/navigation/blocks/side-nav-container";

import { ListForm } from "./list-form";
import { ListsContainer } from "./lists-container";

export function MyListsContainer() {
  const me = useMe();

  return (
    <>
      <h1 className="border-b border-line p-4 text-title">リスト</h1>
      <ListForm summary="新しいリスト" submitLabel="作成する" />
      {me?.profileId ? (
        <ListsContainer handle={me.profileId} />
      ) : (
        <LoadingSpinner label="読み込み中" />
      )}
    </>
  );
}
