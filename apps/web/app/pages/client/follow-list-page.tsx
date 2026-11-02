import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { FollowListContainer } from "@/app/features/profile/blocks/follow-list-container";

type Props = {
  handle: string;
  kind: "follows" | "followers";
};

export function FollowListPage({ handle, kind }: Props) {
  return (
    <ThreeColumnLayout>
      <FollowListContainer handle={handle} kind={kind} />
    </ThreeColumnLayout>
  );
}
