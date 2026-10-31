import { Link } from "react-router";

import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { ConfirmDialog } from "@/app/features/admin/parts/confirm-dialog";
import { ListForm } from "@/app/features/list/blocks/list-form";
import {
  AddListMemberForm,
  RemoveListMemberButton,
} from "@/app/features/list/blocks/list-member-forms";
import {
  type Actor,
  ActorList,
} from "@/app/features/profile/blocks/actor-list";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/blocks/timeline-feed";

type Props = {
  uri: string;
  name: string;
  description?: string;
  tab: "posts" | "members";
  posts: TimelinePost[];
  members: (Actor & { listItemUri: string })[];
  isSelf: boolean;
  onDelete: () => void;
};

export function ListPage({
  uri,
  name,
  description,
  tab,
  posts,
  members,
  isSelf,
  onDelete,
}: Props) {
  return (
    <ThreeColumnLayout>
      <section className="flex flex-col gap-2 border-b border-base-300 p-4">
        <h1 className="text-lg font-bold">{name}</h1>
        {description && (
          <p className="text-sm wrap-break-word whitespace-pre-wrap">
            {description}
          </p>
        )}
      </section>
      {isSelf && (
        <>
          <ListForm
            summary="編集する"
            submitLabel="保存する"
            name={name}
            description={description}
          />
          <ConfirmDialog
            title={`「${name}」を削除しますか？`}
            description="リストとそのメンバー登録が削除され、元に戻せません。"
            confirmLabel="削除する"
            danger
            onConfirm={onDelete}
          >
            {(open) => (
              <button
                type="button"
                className="btn m-4 btn-outline btn-error btn-sm"
                onClick={open}
              >
                削除する
              </button>
            )}
          </ConfirmDialog>
        </>
      )}
      <div role="tablist" className="tabs tabs-border">
        {(
          [
            ["posts", "投稿", "."],
            ["members", "メンバー", "?tab=members"],
          ] as const
        ).map(([value, label, to]) => (
          <Link
            key={value}
            to={to}
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "tab tab-active" : "tab"}
          >
            {label}
          </Link>
        ))}
      </div>
      {tab === "posts" ? (
        <TimelineFeed posts={posts} onCompose={() => {}} />
      ) : (
        <>
          {isSelf && <AddListMemberForm listUri={uri} />}
          <ActorList
            actors={members}
            renderAction={
              isSelf
                ? (member) => (
                    <RemoveListMemberButton listItemUri={member.listItemUri} />
                  )
                : undefined
            }
          />
        </>
      )}
    </ThreeColumnLayout>
  );
}
