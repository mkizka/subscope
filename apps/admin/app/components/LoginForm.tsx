import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { Form, useActionData } from "react-router";

import type { action } from "~/routes/oauth.login";
import { loginSchema } from "~/schemas/login.schema";
import { cn } from "~/utils/cn";

export function LoginForm() {
  const lastResult = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    shouldValidate: "onBlur",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-2xl">
        <div className="card-body">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary rounded-2xl mx-auto flex items-center justify-center">
              <span className="icon-[tabler--atom] text-primary-content text-lg"></span>
            </div>
            <h1 className="text-2xl font-bold text-base-content">Subscope</h1>
            <p className="text-base-content/60 text-sm">管理画面にログイン</p>
          </div>

          <Form
            method="post"
            action="/oauth/login"
            className="space-y-4"
            {...getFormProps(form)}
          >
            {form.errors && (
              <div className="alert alert-error">
                <span className="icon-[tabler--exclamation-circle] size-5"></span>
                <span className="text-sm">{form.errors}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label" htmlFor={fields.identifier.id}>
                <span className="label-text font-medium">ハンドル</span>
              </label>
              <input
                {...getInputProps(fields.identifier, { type: "text" })}
                placeholder="example.bsky.social"
                className={cn(
                  "input input-bordered w-full focus:input-primary",
                  fields.identifier.errors && "input-error",
                )}
              />
              {fields.identifier.errors && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {fields.identifier.errors}
                  </span>
                </label>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block gap-2">
              <span className="icon-[tabler--login] size-4"></span>
              ログイン
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
