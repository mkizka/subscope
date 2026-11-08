import { type ComponentProps, useState } from "react";
import { Form, Link } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  tab: "accounts" | "posts";
  loading: boolean;
  history: string[];
  onRemoveHistory: (word: string) => void;
  onClearHistory: () => void;
};

export function SearchForm({
  formProps,
  inputProps,
  tab,
  loading,
  history,
  onRemoveHistory,
  onClearHistory,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <Form className="flex gap-2 p-4" {...formProps}>
      <div
        className="relative flex-1"
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
      >
        <Input aria-label="検索語" placeholder="検索" {...inputProps} />
        {focused && history.length > 0 && (
          <div
            className="
              absolute inset-x-0 top-full z-10 mt-1 rounded-lg border
              border-line bg-surface
            "
          >
            <ul aria-label="検索履歴">
              {history.map((word) => (
                <li key={word} className="flex items-center">
                  <Link
                    to={`?${new URLSearchParams({ q: word, ...(tab === "posts" && { tab }) })}`}
                    className="flex-1 truncate px-4 py-2 text-body"
                    onClick={() => setFocused(false)}
                  >
                    {word}
                  </Link>
                  <button
                    type="button"
                    aria-label={`${word}を削除`}
                    className="px-4 py-2 text-muted"
                    onClick={() => onRemoveHistory(word)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="
                w-full border-t border-line px-4 py-2 text-left text-label
                text-muted
              "
              onClick={onClearHistory}
            >
              履歴を全て削除
            </button>
          </div>
        )}
      </div>
      {tab === "posts" && <input type="hidden" name="tab" value="posts" />}
      <Button type="submit" loading={loading}>
        検索
      </Button>
    </Form>
  );
}
