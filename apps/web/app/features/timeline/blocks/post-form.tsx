import { useState } from "react";

export const MAX_POST_LENGTH = 300;
export const MAX_IMAGES = 4;

export const countGraphemes = (text: string) =>
  [...new Intl.Segmenter().segment(text)].length;

export const REPLY_RULES = [
  { rule: "follower", label: "フォロワー" },
  { rule: "following", label: "フォロー中" },
  { rule: "mention", label: "メンションした人" },
] as const;

export type ReplyRule = (typeof REPLY_RULES)[number]["rule"];

type Props = {
  isSubmitting: boolean;
  error?: string;
  context?: string;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
};

export function PostForm({
  isSubmitting,
  error,
  context,
  onCancel,
  onSubmit,
}: Props) {
  const [text, setText] = useState("");
  const [allow, setAllow] = useState<ReplyRule[]>();
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const length = countGraphemes(text);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        images.forEach(({ file }) => formData.append("image", file));
        if (allow) {
          formData.set("threadgate", "on");
          allow.forEach((rule) => formData.append("allow", rule));
        }
        onSubmit(formData);
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onCancel}
        >
          キャンセル
        </button>
        {context}
      </div>
      <textarea
        placeholder="いまどうしてる？"
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
      <fieldset className="flex flex-wrap items-center gap-3 text-sm">
        <legend className="sr-only">返信できる人</legend>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            className="radio radio-xs"
            checked={allow === undefined}
            onChange={() => setAllow(undefined)}
          />
          誰でも
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            className="radio radio-xs"
            checked={allow?.length === 0}
            onChange={() => setAllow([])}
          />
          返信不可
        </label>
        {REPLY_RULES.map(({ rule, label }) => (
          <label key={rule} className="flex items-center gap-1">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={allow?.includes(rule) ?? false}
              onChange={(e) => {
                const next = (allow ?? []).filter((r) => r !== rule);
                if (e.target.checked) next.push(rule);
                setAllow(next.length > 0 ? next : undefined);
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
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
