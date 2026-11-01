import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";

type Props = {
  members: Actor[];
  hasMore: boolean;
};

export function MembersPage({ members, hasMore }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-title">
        メンバー{" "}
        <span className="font-normal text-muted">
          {members.length}人{hasMore && "以上"}
        </span>
      </h1>
      <ActorList actors={members} />
    </ThreeColumnLayout>
  );
}
