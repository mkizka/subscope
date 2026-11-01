import { Link } from "react-router";

export type ListSummary = {
  rkey: string;
  name: string;
  description?: string;
};

type Props = {
  lists: ListSummary[];
};

export function ListLinks({ lists }: Props) {
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
            to={list.rkey}
            className="
              block border-b border-line px-4 py-3
              hover:bg-surface-2
            "
          >
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
