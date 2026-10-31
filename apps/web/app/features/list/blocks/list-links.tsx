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
      <p className="py-8 text-center text-sm text-base-content/70">
        リストがありません
      </p>
    );
  }
  return (
    <ul className="list">
      {lists.map((list) => (
        <li key={list.rkey}>
          <Link
            to={list.rkey}
            className="
              list-row
              hover:bg-base-200
            "
          >
            <div className="min-w-0 list-col-grow">
              <p className="truncate font-bold">{list.name}</p>
              {list.description && (
                <p className="truncate text-sm text-base-content/60">
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
