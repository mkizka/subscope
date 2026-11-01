import type { ComponentProps } from "react";
import { Form } from "react-router";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  fields: {
    inviteCode: {
      id: string;
    };
  };
  error?: string;
};

export function InviteCodeForm({
  formProps,
  inputProps,
  fields,
  error,
}: Props) {
  return (
    <Form method="post" className="flex flex-col gap-4" {...formProps}>
      <div className="flex flex-col gap-2">
        <label htmlFor={fields.inviteCode.id} className="text-label">
          招待コード
        </label>
        <input
          className="
            rounded-full border border-line bg-transparent px-4 py-2.5
            outline-none
            focus:border-brand
          "
          placeholder="subsco-me-abcde"
          {...inputProps}
        />
        {error && (
          <p role="alert" className="text-label text-danger">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="
          rounded-full bg-brand py-3 font-bold text-on-brand
          hover:opacity-90
        "
      >
        登録する
      </button>
    </Form>
  );
}
