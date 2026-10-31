import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ListForm } from "@/app/features/list/blocks/list-form";
import {
  ListLinks,
  type ListSummary,
} from "@/app/features/list/blocks/list-links";

type Props = {
  lists: ListSummary[];
  isSelf: boolean;
};

export function ListsPage({ lists, isSelf }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">リスト</h1>
      {isSelf && <ListForm summary="新しいリスト" submitLabel="作成する" />}
      <ListLinks lists={lists} />
    </ThreeColumnLayout>
  );
}
