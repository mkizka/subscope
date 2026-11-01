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
      <div className="flex items-baseline gap-2 border-b border-line p-4">
        <h1 className="text-title">追跡中のユーザー</h1>
        <span className="text-label text-muted">{total}人</span>
      </div>
      <p className="
        border-b border-line bg-surface-2 px-4 py-2 text-label text-muted
      ">
        メンバーとそのフォロー先です。このサーバーはこの人たちの投稿だけを保存します。
      </p>
      <ActorList actors={actors} />
    </ThreeColumnLayout>
  );
}
