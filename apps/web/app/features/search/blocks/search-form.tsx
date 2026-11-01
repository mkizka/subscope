import type { ComponentProps } from "react";
import { Form } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  tab: "actors" | "posts";
};

export function SearchForm({ formProps, inputProps, tab }: Props) {
  return (
    <Form className="flex gap-2 p-4" {...formProps}>
      <div className="flex-1">
        <Input aria-label="検索語" placeholder="検索" {...inputProps} />
      </div>
      {tab === "posts" && <input type="hidden" name="tab" value="posts" />}
      <Button type="submit">検索</Button>
    </Form>
  );
}
