import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ListsContainer } from "@/app/features/list/blocks/lists-container";

type Props = {
  handle: string;
};

export function ListsPage({ handle }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-title">リスト</h1>
      <ListsContainer handle={handle} />
    </ThreeColumnLayout>
  );
}
