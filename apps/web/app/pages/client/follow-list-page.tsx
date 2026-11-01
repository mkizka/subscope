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
      <h1 className="sticky top-0 border-b border-line bg-surface p-4 text-title">
        {title}{" "}
        <span className="font-normal text-muted">
          {subject.displayName || subject.handle}
        </span>
      </h1>
      <ActorList actors={actors} />
    </ThreeColumnLayout>
  );
}
