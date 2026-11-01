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
      <div className="flex flex-col gap-2">
        <label htmlFor={fields.identifier.id} className="text-sm font-bold">
          ハンドル
        </label>
        <div
          className="
            flex items-center gap-2 rounded-full border border-line px-4 py-2.5
            focus-within:border-brand
          "
        >
          <AtSign className="size-4 text-muted" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="example.bsky.social"
            autoComplete="username"
            {...inputProps}
          />
        </div>
        {fields.identifier.errors && (
          <p role="alert" className="text-sm text-danger">
            {fields.identifier.errors[0]}
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
        ログイン
      </button>
    </Form>
  );
}
