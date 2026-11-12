import { ListIcon } from "lucide-react";
import type { RefObject } from "react";
import { Link } from "react-router";

import { ListsSkeleton } from "@/app/components/rows-skeleton";
import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";

import {
  AddListMemberButton,
  RemoveListMemberButton,
} from "./list-member-forms";

export type MembershipList = {
  uri: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  listItemUri?: string;
};

type Props = {
  ref: RefObject<HTMLDialogElement | null>;
  did: string;
  lists?: MembershipList[];
  onClose: () => void;
};

export function AddToListDialog({ ref, did, lists, onClose }: Props) {
  return (
    <Dialog
      ref={ref}
      title="リストに追加"
      onClose={onClose}
      actions={<Button onClick={() => ref.current?.close()}>完了</Button>}
    >
      {!lists ? (
        <ListsSkeleton />
      ) : lists.length === 0 ? (
        <p className="py-4 text-center text-label text-muted">
          リストがありません。
          <Link to="/lists" className="text-brand">
            リストを作成
          </Link>
        </p>
      ) : (
        <ul>
          {lists.map((list) => (
            <li
              key={list.uri}
              className="flex items-center gap-3 border-b border-line py-3"
            >
              <Avatar
                src={list.avatarUrl}
                icon={<ListIcon className="size-5" />}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-bold">{list.name}</p>
                {list.description && (
                  <p className="truncate text-label text-muted">
                    {list.description}
                  </p>
                )}
              </div>
              {list.listItemUri ? (
                <RemoveListMemberButton listItemUri={list.listItemUri} />
              ) : (
                <AddListMemberButton listUri={list.uri} did={did} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
