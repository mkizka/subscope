import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  ListLinks,
  type ListSummary,
} from "@/app/features/list/blocks/list-links";

type Props = {
  lists: ListSummary[];
};

export function ListsPage({ lists }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">リスト</h1>
      <ListLinks lists={lists} />
    </ThreeColumnLayout>
  );
}
