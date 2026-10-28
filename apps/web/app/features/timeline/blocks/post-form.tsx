import { useState } from "react";

export const MAX_POST_LENGTH = 300;

export const countGraphemes = (text: string) =>
  [...new Intl.Segmenter().segment(text)].length;

type Props = {
  isSubmitting: boolean;
  error?: string;
  context?: string;
  onCancelContext?: () => void;
  onSubmit: (text: string) => void;
};

export function PostForm({
  isSubmitting,
  error,
  context,
  onCancelContext,
  onSubmit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const length = countGraphemes(text);

  if (!isOpen && !context) {
    return (
      <button
        type="button"
        className="input w-full cursor-text text-base-content/60"
        onClick={() => setIsOpen(true)}
      >
        いまどうしてる？
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(text);
      }}
    >
      {context && (
        <div className="flex items-center justify-between text-sm">
          {context}
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={onCancelContext}
          >
            やめる
          </button>
        </div>
      )}
      <textarea
        aria-label="投稿内容"
        className="textarea w-full"
        rows={4}
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-end gap-3">
        {error && <span className="mr-auto text-sm text-error">{error}</span>}
        <span className={length > MAX_POST_LENGTH ? "text-error" : "text-sm"}>
          {length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            isSubmitting || text.trim() === "" || length > MAX_POST_LENGTH
          }
        >
          投稿
        </button>
      </div>
    </form>
  );
}
