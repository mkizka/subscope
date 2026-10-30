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
      <fieldset className="fieldset">
        <label htmlFor={fields.inviteCode.id} className="fieldset-legend">
          招待コード
        </label>
        <input
          className="input w-full"
          placeholder="subsco-me-abcde"
          {...inputProps}
        />
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
      </fieldset>
      <button type="submit" className="btn self-center btn-primary">
        登録する
      </button>
    </Form>
  );
}
