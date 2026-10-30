import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";

type Props = {
  members: Actor[];
};

export function MembersPage({ members }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">
        メンバー
      </h1>
      <ActorList actors={members} />
    </ThreeColumnLayout>
  );
}
