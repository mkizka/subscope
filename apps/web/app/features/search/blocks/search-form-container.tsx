import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { z } from "zodV4";

import { SearchForm } from "./search-form";

export const searchSchema = z.object({
  q: z.string().optional(),
});

type Props = {
  q?: string;
};

export const SearchFormContainer = ({ q }: Props) => {
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
    />
  );
};
