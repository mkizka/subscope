import { Link } from "react-router";

type Props = {
  history: string[];
  hrefFor: (word: string) => string;
  onSelect: () => void;
  onRemove: (word: string) => void;
  onClear: () => void;
};

export function SearchHistory({
  history,
  hrefFor,
  onSelect,
  onRemove,
  onClear,
}: Props) {
  return (
    <div
      className="
        absolute inset-x-0 top-full z-dropdown mt-1 rounded-lg border border-line
        bg-surface
      "
    >
      <ul aria-label="検索履歴">
        {history.map((word) => (
          <li key={word} className="flex items-center">
            <Link
              to={hrefFor(word)}
              className="flex-1 truncate px-4 py-2 text-body"
              onClick={onSelect}
            >
              {word}
            </Link>
            <button
              type="button"
              aria-label={`${word}を削除`}
              className="px-4 py-2 text-muted"
              onClick={() => onRemove(word)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="
          w-full border-t border-line px-4 py-2 text-left text-label text-muted
        "
        onClick={onClear}
      >
        履歴を全て削除
      </button>
    </div>
  );
}
