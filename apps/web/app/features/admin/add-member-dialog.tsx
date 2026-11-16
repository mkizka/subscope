import { UserPlusIcon } from "lucide-react";
import { useId, useRef } from "react";

import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

type Props = {
  onAdd: (actor: string) => Promise<unknown>;
  isAdding?: boolean;
  error?: string;
  onClose?: () => void;
};

export function AddMemberDialog({ onAdd, isAdding, error, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
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
              disabled={isAdding}
              onClick={() => ref.current?.close()}
            >
              キャンセル
            </Button>
            <Button type="submit" form={formId} loading={isAdding}>
              追加する
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const actor = (inputRef.current?.value ?? "")
              .trim()
              .replace(/^@/, "");
            void onAdd(actor).then(
              () => {
                form.reset();
                ref.current?.close();
              },
              () => {},
            );
          }}
        >
          <p className="text-label text-muted">
            本人のログインなしでメンバーにします。追加したアカウントは、サーバーのページのメンバー一覧にも表示されます。
          </p>
          <Input
            ref={inputRef}
            label="ハンドルまたはDID"
            placeholder="example.bsky.social"
            required
            disabled={isAdding}
            error={error}
          />
        </form>
      </Dialog>
    </>
  );
}
