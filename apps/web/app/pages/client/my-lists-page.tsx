import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { MyListsContainer } from "@/app/features/list/blocks/my-lists-container";

export function MyListsPage() {
  return (
    <ThreeColumnLayout>
      <MyListsContainer />
    </ThreeColumnLayout>
  );
}
