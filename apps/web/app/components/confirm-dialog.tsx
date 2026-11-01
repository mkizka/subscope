import { type ReactNode, useRef } from "react";

import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  children: (open: () => void) => ReactNode;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  onConfirm,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      {children(() => ref.current?.showModal())}
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
            <Button
              type="button"
              variant={danger ? "danger" : "primary"}
              onClick={() => {
                ref.current?.close();
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <p>{description}</p>
      </Dialog>
    </>
  );
}
