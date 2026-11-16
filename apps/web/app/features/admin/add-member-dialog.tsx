import { UserPlusIcon } from "lucide-react";
import type { ComponentProps, RefObject } from "react";
import { Form } from "react-router";

import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

type Props = {
  ref: RefObject<HTMLDialogElement | null>;
  formProps: ComponentProps<typeof Form>;
  inputProps: ComponentProps<"input">;
  error?: string;
  loading: boolean;
  onClose: () => void;
};

export function AddMemberDialog({
  ref,
  formProps,
  inputProps,
  error,
  loading,
  onClose,
}: Props) {
  return (
    <>
      <Button type="button" onClick={() => ref.current?.showModal()}>
        <UserPlusIcon className="size-4" />
        メンバーを追加
      </Button>
      <Dialog
        ref={ref}
        title="メンバーを追加"
        onClose={onClose}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => ref.current?.close()}
            >
              キャンセル
            </Button>
            <Button type="submit" form={formProps.id} loading={loading}>
              追加する
            </Button>
          </>
        }
      >
        <Form className="flex flex-col gap-3" {...formProps}>
          <p className="text-label text-muted">
            本人のログインなしでメンバーにします。追加したアカウントは、サーバーのページのメンバー一覧にも表示されます。
          </p>
          <Input
            label="ハンドルまたはDID"
            placeholder="example.bsky.social"
            disabled={loading}
            error={error}
            {...inputProps}
          />
        </Form>
      </Dialog>
    </>
  );
}
