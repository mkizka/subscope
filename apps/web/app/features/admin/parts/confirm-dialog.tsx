import { type ReactNode, useRef } from "react";

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
      <dialog ref={ref} className="modal" aria-label={title}>
        <div className="modal-box">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="py-4">{description}</p>
          <form method="dialog" className="modal-action">
            <button type="submit" className="btn btn-ghost">
              キャンセル
            </button>
            <button
              type="submit"
              className={danger ? "btn btn-error" : "btn btn-primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">閉じる</button>
        </form>
      </dialog>
    </>
  );
}
