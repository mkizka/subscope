import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { ThreeColumnLayout } from "@/app/components/three-column-layout";
import { Button } from "@/app/components/ui/button";
import { Tabs } from "@/app/components/ui/tabs";
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
      <section className="flex flex-col gap-2 border-b border-line p-4">
        <h1 className="text-title">{name}</h1>
        {description && (
          <p className="wrap-break-word whitespace-pre-wrap">{description}</p>
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
              <div className="m-4">
                <Button variant="danger" size="sm" onClick={open}>
                  削除する
                </Button>
              </div>
            )}
          </ConfirmDialog>
        </>
      )}
      <Tabs
        tabs={[
          { to: ".", label: "投稿", selected: tab === "posts" },
          {
            to: "?tab=members",
            label: "メンバー",
            selected: tab === "members",
          },
        ]}
      />
      {tab === "posts" ? (
        <TimelineFeed posts={posts} />
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
