import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useIsFetching } from "@tanstack/react-query";
import { z } from "zodV4";

import { useSearchHistory } from "@/app/features/search/use-search-history";

import { SearchForm } from "./search-form";

export const searchSchema = z.object({
  q: z.string().optional(),
  tab: z.literal("posts").optional(),
});

type Props = {
  q?: string;
  tab: "accounts" | "posts";
};

export const SearchFormContainer = ({ q, tab }: Props) => {
  const { history, remove, clear } = useSearchHistory(q);
  const fetching = useIsFetching({ queryKey: ["search"] }) > 0;
  const [form, fields] = useForm({
    id: "search-form",
    defaultValue: { q },
    constraint: getZodConstraint(searchSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: searchSchema });
    },
  });

  return (
    <SearchForm
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.q, { type: "search" })}
      tab={tab}
      loading={fetching}
      history={history}
      onRemoveHistory={remove}
      onClearHistory={clear}
    />
  );
};
