import { AtSign } from "lucide-react";
import type { ComponentProps } from "react";
import { Form } from "react-router";

type Props = {
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  fields: {
    identifier: {
      id: string;
      errors?: string[];
    };
  };
};

export function LoginForm({ formProps, inputProps, fields }: Props) {
  return (
    <Form
      action="/oauth/login"
      method="POST"
      className="flex flex-col gap-4"
      {...formProps}
    >
      <fieldset className="fieldset">
        <label htmlFor={fields.identifier.id} className="fieldset-legend">
          ハンドル
        </label>
        <div className="input w-full">
          <AtSign className="size-4 opacity-50" />
          <input
            placeholder="example.bsky.social"
            autoComplete="username"
            {...inputProps}
          />
        </div>
        {fields.identifier.errors && (
          <p role="alert" className="text-error">
            {fields.identifier.errors[0]}
          </p>
        )}
      </fieldset>
      <button type="submit" className="btn btn-block btn-primary">
        ログイン
      </button>
    </Form>
  );
}
