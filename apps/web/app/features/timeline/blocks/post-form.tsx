import { useState } from "react";

export const MAX_POST_LENGTH = 300;

export const countGraphemes = (text: string) =>
  [...new Intl.Segmenter().segment(text)].length;

const REPLY_RULES = [
  { rule: "follower", label: "フォロワー" },
  { rule: "following", label: "フォロー中" },
  { rule: "mention", label: "メンションした人" },
] as const;

export type ReplyRule = (typeof REPLY_RULES)[number]["rule"];

export const isReplyRule = (value: string): value is ReplyRule =>
  REPLY_RULES.some(({ rule }) => rule === value);

type Props = {
  isSubmitting: boolean;
  error?: string;
  onSubmit: (text: string, allow?: ReplyRule[]) => void;
};

export function PostForm({ isSubmitting, error, onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [allow, setAllow] = useState<ReplyRule[]>();
  const length = countGraphemes(text);

  if (!isOpen) {
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
        onSubmit(text, allow);
      }}
    >
      <textarea
        aria-label="投稿内容"
        className="textarea w-full"
        rows={4}
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
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
