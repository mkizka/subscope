import {
  ArrowLeftIcon,
  EllipsisIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "@/app/components/confirm-dialog";
import { Menu, menuItemClass } from "@/app/components/ui/menu";
import { Tabs } from "@/app/components/ui/tabs";
import { type Account, AccountList } from "@/app/features/account/account-list";
import {
  TimelineFeed,
  type TimelinePost,
} from "@/app/features/timeline/timeline-feed";

import { ListForm } from "./list-form";
import { AddListMemberForm, RemoveListMemberButton } from "./list-member-forms";

type Props = {
  handle: string;
  uri: string;
  name: string;
  description?: string;
  tab: "posts" | "members";
  posts: TimelinePost[];
  members: (Account & { listItemUri: string })[];
  isSelf: boolean;
  deleting?: boolean;
  onDelete: () => void;
};

export function ListDetail({
  handle,
  uri,
  name,
  description,
  tab,
  posts,
  members,
  isSelf,
  deleting,
  onDelete,
}: Props) {
  const editRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <header className="flex items-center gap-2 border-b border-line p-4">
        <Link
          to={`/${handle}/lists`}
          aria-label="戻る"
          className="shrink-0 text-muted"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-title">{name}</h1>
          <p className="text-caption text-muted">@{handle} が作成</p>
        </div>
        {isSelf && (
          <ConfirmDialog
            title={`「${name}」を削除しますか？`}
            description="リストとそのメンバー登録が削除され、元に戻せません。"
            confirmLabel="削除する"
            danger
            onConfirm={onDelete}
          >
            {(openDelete) => (
              <Menu
                label="操作"
                loading={deleting}
                trigger={<EllipsisIcon className="size-4" />}
              >
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => editRef.current?.showModal()}
                >
                  <PencilIcon className="size-4" />
                  編集する
                </button>
                <button
                  type="button"
                  className={`
                    ${menuItemClass}
                    text-danger
                  `}
                  onClick={openDelete}
                >
                  <TrashIcon className="size-4" />
                  削除する
                </button>
              </Menu>
            )}
          </ConfirmDialog>
        )}
      </header>
      {description && (
        <p
          className="
            border-b border-line p-4 wrap-break-word whitespace-pre-wrap
          "
        >
          {description}
        </p>
      )}
      {isSelf && (
        <ListForm
          ref={editRef}
          title="リストを編集"
          submitLabel="保存する"
          name={name}
          description={description}
        />
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
          <AccountList
            accounts={members}
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
    </>
  );
}
