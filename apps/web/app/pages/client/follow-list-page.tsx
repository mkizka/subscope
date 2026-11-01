import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";

type Props = {
  title: string;
  subject: Actor;
  actors: Actor[];
};

export function FollowListPage({ title, subject, actors }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-line p-4 text-lg font-bold">
        {title}{" "}
        <span className="font-normal text-muted">
          {subject.displayName || subject.handle}
        </span>
      </h1>
      <ActorList actors={actors} />
    </ThreeColumnLayout>
  );
}
