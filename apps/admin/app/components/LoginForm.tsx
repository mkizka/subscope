import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { Form, useActionData } from "react-router";

import type { action } from "~/routes/oauth.login";
import { loginSchema } from "~/schemas/login.schema";

export function LoginForm() {
  const lastResult = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <Form
            method="post"
            action="/oauth/login"
            className="space-y-4"
            {...getFormProps(form)}
          >
            {form.errors && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{form.errors}</p>
              </div>
            )}
            <div>
              <label
                htmlFor={fields.identifier.id}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bluesky Handle
              </label>
              <input
                {...getInputProps(fields.identifier, { type: "text" })}
                placeholder="example.bsky.social"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {fields.identifier.errors && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id={fields.identifier.errorId}
                >
                  {fields.identifier.errors}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              ログイン
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
