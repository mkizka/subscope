import { useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";

export const MAX_ALT_LENGTH = 2000;

const countGraphemes = (text: string) =>
  [...new Intl.Segmenter().segment(text)].length;

type Props = {
  imageUrl: string;
  defaultValue: string;
  onSave: (alt: string) => void;
  onClose: () => void;
};

export function AltDialog({ imageUrl, defaultValue, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [alt, setAlt] = useState(defaultValue);
  const length = countGraphemes(alt);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <Dialog
      ref={ref}
      title="ALTを追加"
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={length > MAX_ALT_LENGTH}
            onClick={() => onSave(alt)}
          >
            完了
          </Button>
        </>
      }
    >
      <img src={imageUrl} alt="" className="max-h-64 rounded-xl object-cover" />
      <textarea
        aria-label="ALT"
        placeholder="この画像を、見えない人にも伝わるように説明してください"
        rows={4}
        autoFocus
        className="
          resize-none rounded-xl border border-line px-3 py-2 text-body
        "
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
      />
      <p
        className={`
          text-right text-caption
          ${length > MAX_ALT_LENGTH ? "text-danger" : "text-muted"}
        `}
      >
        {length}/{MAX_ALT_LENGTH}
      </p>
    </Dialog>
  );
}
