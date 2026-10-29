import { useState } from "react";

export const MAX_POST_LENGTH = 300;
export const MAX_IMAGES = 4;

export const countGraphemes = (text: string) =>
  [...new Intl.Segmenter().segment(text)].length;

type Props = {
  isSubmitting: boolean;
  error?: string;
  context?: string;
  onCancelContext?: () => void;
  onSubmit: (formData: FormData) => void;
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
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
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
        const formData = new FormData(e.currentTarget);
        images.forEach(({ file }) => formData.append("image", file));
        onSubmit(formData);
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
        name="text"
        aria-label="投稿内容"
        className="textarea w-full"
        rows={4}
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map(({ file, url }, i) => (
            <div key={url} className="flex flex-col gap-1">
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <input
                name="alt"
                aria-label={`画像${i + 1}のALT`}
                placeholder="ALT"
                className="input w-full input-sm"
              />
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() =>
                  setImages(images.filter((it) => it.file !== file))
                }
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        <label
          className={`
            btn mr-auto btn-ghost btn-sm
            ${images.length >= MAX_IMAGES ? "btn-disabled" : ""}
          `}
        >
          画像を追加
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={images.length >= MAX_IMAGES}
            onChange={(e) => {
              const files = [...(e.target.files ?? [])].map((file) => ({
                file,
                url: URL.createObjectURL(file),
              }));
              setImages([...images, ...files].slice(0, MAX_IMAGES));
              e.target.value = "";
            }}
          />
        </label>
        {error && <span className="text-sm text-error">{error}</span>}
        <span className={length > MAX_POST_LENGTH ? "text-error" : "text-sm"}>
          {length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            isSubmitting ||
            (text.trim() === "" && images.length === 0) ||
            length > MAX_POST_LENGTH
          }
        >
          投稿
        </button>
      </div>
    </form>
  );
}
