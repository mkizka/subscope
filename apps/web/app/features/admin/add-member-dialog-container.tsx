import { type AtIdentifierString, isAtIdentifierString } from "@atproto/syntax";
import {
  getFormProps,
  getInputProps,
  type SubmissionResult,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { z } from "zodV4";

import { AddMemberDialog } from "./add-member-dialog";

export const addMemberSchema = z.object({
  actor: z
    .string({ message: "ハンドルかDIDを入力してください" })
    .transform((value) => value.trim().replace(/^@/, ""))
    .pipe(
      z.custom<AtIdentifierString>(
        isAtIdentifierString,
        "ハンドルかDIDの形で入力してください",
      ),
    ),
});

export function AddMemberDialogContainer() {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const fetcher = useFetcher<SubmissionResult>();
  const [form, fields] = useForm({
    id: "add-member-form",
    lastResult: fetcher.data,
    constraint: getZodConstraint(addMemberSchema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: addMemberSchema });
    },
    onSubmit(event, { formData }) {
      event.preventDefault();
      void fetcher.submit(formData, {
        method: "PUT",
        action: "/admin/api/server-members",
      });
    },
  });
  const isAdded =
    fetcher.state === "idle" && fetcher.data?.status === "success";

  useEffect(() => {
    if (!isAdded) return;
    ref.current?.close();
    void queryClient.invalidateQueries({ queryKey: ["serverMembers"] });
  }, [isAdded, queryClient]);

  return (
    <AddMemberDialog
      ref={ref}
      formProps={getFormProps(form)}
      inputProps={getInputProps(fields.actor, { type: "text" })}
      error={(form.errors ?? fields.actor.errors)?.[0]}
      loading={fetcher.state !== "idle"}
      onClose={() => form.reset()}
    />
  );
}
