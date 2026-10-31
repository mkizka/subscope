import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Form } from "react-router";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  tab: "actors" | "posts";
};

export function SearchForm({ formProps, inputProps, tab }: Props) {
  return (
    <Form className="join w-full p-4" {...formProps}>
      <label className="input join-item w-full">
        <SearchIcon className="size-4 opacity-50" />
        <input aria-label="検索語" placeholder="検索" {...inputProps} />
      </label>
      {tab === "posts" && <input type="hidden" name="tab" value="posts" />}
      <button type="submit" className="btn join-item btn-primary">
        検索
      </button>
    </Form>
  );
}
