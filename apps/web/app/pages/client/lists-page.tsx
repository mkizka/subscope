import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ListsContainer } from "@/app/features/list/blocks/lists-container";
import { ProfileContainer } from "@/app/features/profile/blocks/profile-container";

type Props = {
  handle: string;
};

export function ListsPage({ handle }: Props) {
  return (
    <ThreeColumnLayout>
      <ProfileContainer
        handle={handle}
        listsTab={<ListsContainer handle={handle} />}
      />
    </ThreeColumnLayout>
  );
}
