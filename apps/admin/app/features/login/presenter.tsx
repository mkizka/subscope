import type { SubmissionResult } from "@conform-to/react";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { Form } from "react-router";

import { loginSchema } from "~/schemas/login.schema";

type LoginPresenterProps = {
  isSubmitting: boolean;
  lastResult?: SubmissionResult;
};

export function LoginPresenter({
  isSubmitting,
  lastResult,
}: LoginPresenterProps) {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    shouldValidate: "onBlur",
  });
  return (
    <div className="flex items-center justify-center min-h-dvh fixed inset-0">
      <div className="card bg-base-100 w-full max-w-sm shadow-sm">
        <div className="card-body">
          <h1 className="text-xl font-bold text-center mb-4">
            ATProtoでログイン
          </h1>
          <Form
            method="post"
            action="/oauth/login"
            className="space-y-4"
            {...getFormProps(form)}
          >
            {form.errors && (
              <div className="text-error text-sm">{form.errors}</div>
            )}
            <div>
              <label
                htmlFor={fields.identifier.id}
                className="block text-sm mb-1"
              >
                ハンドル
              </label>
              <input
                {...getInputProps(fields.identifier, { type: "text" })}
                placeholder="example.bsky.social"
                className="input input-bordered w-full"
              />
              {fields.identifier.errors && (
                <div className="text-error text-sm mt-1">
                  {fields.identifier.errors}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm" />
              )}
              ログイン
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
