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
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">
        メンバー{" "}
        <span className="font-normal text-base-content/60">
          {members.length}人{hasMore && "以上"}
        </span>
      </h1>
      <ActorList actors={members} />
    </ThreeColumnLayout>
  );
}
