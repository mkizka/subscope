import { type RefObject, useEffect, useId, useRef } from "react";
import { Form, useNavigation } from "react-router";
import { z } from "zodV4";

import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

export const listSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().max(300).optional(),
});

type Props = {
  ref: RefObject<HTMLDialogElement | null>;
  title: string;
  submitLabel: string;
  name?: string;
  description?: string;
};

export function ListForm({
  ref,
  title,
  submitLabel,
  name,
  description,
}: Props) {
  const formId = useId();
  const navigation = useNavigation();
  const submitting = navigation.formData?.has("name") ?? false;
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (wasSubmittingRef.current && !submitting) ref.current?.close();
    wasSubmittingRef.current = submitting;
  }, [submitting, ref]);

  return (
    <Dialog
      ref={ref}
      title={title}
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => ref.current?.close()}
          >
            キャンセル
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <Form id={formId} method="post" className="flex flex-col gap-3">
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
      </Form>
    </Dialog>
  );
}
