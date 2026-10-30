import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type TrackedActor,
  TrackedActorList,
} from "@/app/features/tracked-actors/blocks/tracked-actor-list";

type Props = {
  actors: TrackedActor[];
};

export function TrackedActorsPage({ actors }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">
        追跡中のユーザー
      </h1>
      <TrackedActorList actors={actors} />
    </ThreeColumnLayout>
  );
}
