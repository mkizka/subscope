import { ListIcon } from "lucide-react";
import { Link } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";

export type ListSummary = {
  rkey: string;
  name: string;
  description?: string;
  avatarUrl?: string;
};

type Props = {
  handle: string;
  lists: ListSummary[];
};

export function ListLinks({ handle, lists }: Props) {
  if (lists.length === 0) {
    return (
      <p className="py-8 text-center text-label text-muted">
        リストがありません
      </p>
    );
  }
  return (
    <ul>
      {lists.map((list) => (
        <li key={list.rkey}>
          <Link
            to={`/${handle}/lists/${list.rkey}`}
            className="
              flex items-center gap-3 border-b border-line px-4 py-3
              hover:bg-surface-2
            "
          >
            <Avatar
              src={list.avatarUrl}
              icon={<ListIcon className="size-5" />}
            />
            <div className="min-w-0">
              <p className="truncate text-heading">{list.name}</p>
              {list.description && (
                <p className="truncate text-label text-muted">
                  {list.description}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
