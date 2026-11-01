import { clsx } from "clsx";
import { type Ref, useId, useState } from "react";

import { Avatar } from "@/app/components/ui/avatar";
import { Button, buttonClass } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  formatRelativeTime,
  type PostCardProps,
  QuotedPost,
} from "@/app/features/timeline/parts/post-card";
import { useHydrated } from "@/app/lib/use-hydrated";

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

export type ComposePost = Pick<
  PostCardProps,
  "authorAvatar" | "authorDisplayName" | "authorHandle" | "text" | "createdAt"
>;

const TITLES = { reply: "返信", quote: "引用" };

function Author({
  displayName,
  handle,
  createdAt,
}: {
  displayName?: string;
  handle?: string;
  createdAt?: string;
}) {
  const hydrated = useHydrated();
  return (
    <div className="flex items-baseline gap-2 text-label">
      <span className="truncate font-bold">{displayName ?? handle}</span>
      <span className="truncate text-muted">@{handle}</span>
      {createdAt && hydrated && (
        <span className="shrink-0 text-muted">
          {formatRelativeTime(createdAt)}
        </span>
      )}
    </div>
  );
}

type Props = {
  ref?: Ref<HTMLDialogElement>;
  open?: boolean;
  isSubmitting: boolean;
  error?: string;
  author?: { avatarUrl?: string; displayName?: string; handle?: string };
  target?: { type: "reply" | "quote"; post: ComposePost };
  onCancel: () => void;
  onClose?: () => void;
  onSubmit: (formData: FormData) => void;
};

export function PostForm({
  ref,
  open,
  isSubmitting,
  error,
  author,
  target,
  onCancel,
  onClose,
  onSubmit,
}: Props) {
  const formId = useId();
  const [text, setText] = useState("");
  const [allow, setAllow] = useState<ReplyRule[]>();
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const length = countGraphemes(text);

  return (
    <Dialog
      ref={ref}
      open={open}
      title={target ? TITLES[target.type] : "新規投稿"}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onCancel}>
            キャンセル
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={isSubmitting}
            disabled={
              (text.trim() === "" && images.length === 0) ||
              length > MAX_POST_LENGTH
            }
          >
            {target?.type === "reply" ? "返信" : "投稿"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
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
        {target?.type === "reply" && (
          <article aria-label="返信先" className="flex gap-3">
            <div className="flex flex-col items-center gap-1">
              <Avatar src={target.post.authorAvatar} />
              <div className="w-0.5 flex-1 bg-line" />
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <Author
                displayName={target.post.authorDisplayName}
                handle={target.post.authorHandle}
                createdAt={target.post.createdAt}
              />
              <p className="line-clamp-3 wrap-break-word whitespace-pre-wrap">
                {target.post.text}
              </p>
            </div>
          </article>
        )}
        <div className="flex gap-3">
          <Avatar src={author?.avatarUrl} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {author && (
              <Author displayName={author.displayName} handle={author.handle} />
            )}
            <textarea
              placeholder="いまどうしてる？"
              name="text"
              aria-label="投稿内容"
              rows={4}
              autoFocus
              className="resize-none bg-transparent text-body outline-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.map(({ file, url }, i) => (
                  <div key={url} className="flex flex-col gap-1">
                    <img
                      src={url}
                      alt=""
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <Input
                      name="alt"
                      aria-label={`画像${i + 1}のALT`}
                      placeholder="ALT"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setImages(images.filter((it) => it.file !== file))
                      }
                    >
                      削除
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {target?.type === "quote" && <QuotedPost quote={target.post} />}
          </div>
        </div>
        <fieldset
          className={`flex flex-wrap items-center gap-3 text-label text-muted`}
        >
          <legend className="sr-only">返信できる人</legend>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={allow === undefined}
              onChange={() => setAllow(undefined)}
            />
            誰でも
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={allow?.length === 0}
              onChange={() => setAllow([])}
            />
            返信不可
          </label>
          {REPLY_RULES.map(({ rule, label }) => (
            <label key={rule} className="flex items-center gap-1">
              <input
                type="checkbox"
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
        <div
          className={`
            flex items-center gap-3 border-t border-line pt-3 text-label
            text-muted
          `}
        >
          <label
            className={clsx(
              buttonClass({ variant: "secondary", size: "sm" }),
              "mr-auto",
              images.length >= MAX_IMAGES && "pointer-events-none opacity-50",
            )}
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
          {error && <span className="text-danger">{error}</span>}
          <span className={clsx(length > MAX_POST_LENGTH && "text-danger")}>
            {length}/{MAX_POST_LENGTH}
          </span>
        </div>
      </form>
    </Dialog>
  );
}
