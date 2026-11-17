import { type ComponentProps, useState } from "react";
import { Form } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

import { SearchHistory } from "./search-history";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  loading: boolean;
  history: string[];
  onRemoveHistory: (word: string) => void;
  onClearHistory: () => void;
};

export function SearchForm({
  formProps,
  inputProps,
  loading,
  history,
  onRemoveHistory,
  onClearHistory,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <Form
      className="flex gap-2 p-4"
      {...formProps}
      onSubmit={(e) => {
        formProps.onSubmit?.(e);
        e.currentTarget.querySelector("input")?.blur();
      }}
    >
      <div
        className="relative flex-1"
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
      >
        <Input aria-label="検索語" placeholder="検索" {...inputProps} />
        {focused && history.length > 0 && (
          <SearchHistory
            history={history}
            hrefFor={(word) => `?${new URLSearchParams({ q: word })}`}
            onSelect={() => setFocused(false)}
            onRemove={onRemoveHistory}
            onClear={onClearHistory}
          />
        )}
      </div>
      <Button type="submit" loading={loading}>
        検索
      </Button>
    </Form>
  );
}
