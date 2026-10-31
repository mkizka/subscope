import { Form } from "react-router";
import { z } from "zodV4";

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
    <details className="collapse border-b border-base-300">
      <summary className="collapse-title font-bold">{summary}</summary>
      <Form method="post" className="collapse-content flex flex-col gap-2">
        <label className="fieldset">
          <span className="fieldset-legend">名前</span>
          <input
            name="name"
            className="input w-full"
            required
            maxLength={64}
            defaultValue={name}
          />
        </label>
        <label className="fieldset">
          <span className="fieldset-legend">説明</span>
          <input
            name="description"
            className="input w-full"
            maxLength={300}
            defaultValue={description}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </Form>
    </details>
  );
}
