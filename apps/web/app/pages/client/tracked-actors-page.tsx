import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";

type Props = {
  actors: Actor[];
  total: number;
};

export function TrackedActorsPage({ actors, total }: Props) {
  return (
    <ThreeColumnLayout>
      <div className="flex items-baseline gap-2 border-b border-base-300 p-4">
        <h1 className="text-lg font-bold">追跡中のユーザー</h1>
        <span className="text-sm text-base-content/70">{total}人</span>
      </div>
      <p
        className="
          border-b border-base-300 bg-base-200 px-4 py-2 text-sm
          text-base-content/60
        "
      >
        メンバーとそのフォロー先です。このサーバーはこの人たちの投稿だけを保存します。
      </p>
      <ActorList actors={actors} />
    </ThreeColumnLayout>
  );
}
