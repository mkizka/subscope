import { Form } from "react-router";
import { z } from "zodV4";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export const listSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().max(300).optional(),
});

type Props = {
  summary: string;
  submitLabel: string;
  name?: string;
  description?: string;
};

export function ListForm({ summary, submitLabel, name, description }: Props) {
  return (
    <details className="border-b border-line">
      <summary
        className="
          cursor-pointer p-4 text-heading
          hover:bg-surface-2
        "
      >
        {summary}
      </summary>
      <Form method="post" className="flex flex-col gap-3 px-4 pb-4">
        <Input
          label="名前"
          name="name"
          required
          maxLength={64}
          defaultValue={name}
        />
        <Input
          label="説明"
          name="description"
          maxLength={300}
          defaultValue={description}
        />
        <div className="self-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </Form>
    </details>
  );
}
