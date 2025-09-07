import { useEffect, useRef, useState } from "react";

import { cn } from "~/utils/cn";

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
}

export function CreatedInviteCodeModal({
  isOpen,
  onClose,
  inviteCode,
}: InviteCodeModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
    } catch {
      alert("クリップボードへのコピーに失敗しました");
    }
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">招待コードを作成しました</h3>
        <div className="flex items-center gap-2">
          <div className="input input-bordered font-mono flex-1 cursor-text">
            {inviteCode}
          </div>
          <button
            className="btn btn-square btn-outline"
            onClick={handleCopy}
            disabled={isCopied}
          >
            <span
              className={cn("size-5", {
                "icon-[tabler--copy]": !isCopied,
                "icon-[tabler--check]": isCopied,
              })}
            />
          </button>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
