import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ListDetailContainer } from "@/app/features/list/list-detail-container";

type Props = {
  handle: string;
  rkey: string;
};

export function ListPage({ handle, rkey }: Props) {
  return (
    <ThreeColumnLayout>
      <ListDetailContainer handle={handle} rkey={rkey} />
    </ThreeColumnLayout>
  );
}
