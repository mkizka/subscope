import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";
import { SearchFormContainer } from "@/app/features/search/blocks/search-form-container";

type Props = {
  q?: string;
  actors: Actor[];
};

export function SearchPage({ q, actors }: Props) {
  return (
    <ThreeColumnLayout>
      <h1 className="border-b border-base-300 p-4 text-lg font-bold">検索</h1>
      <SearchFormContainer q={q} />
      {q &&
        (actors.length > 0 ? (
          <ActorList actors={actors} />
        ) : (
          <p className="p-4 text-center text-base-content/60">
            ユーザーが見つかりません
          </p>
        ))}
    </ThreeColumnLayout>
  );
}
