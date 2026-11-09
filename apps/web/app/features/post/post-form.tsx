import { clsx } from "clsx";
import { Globe, X } from "lucide-react";
import { type Ref, useId, useState } from "react";

import { Avatar } from "@/app/components/ui/avatar";
import { Button, buttonClass } from "@/app/components/ui/button";
import { Dialog } from "@/app/components/ui/dialog";
import { useHydrated } from "@/app/lib/use-hydrated";

import { AltDialog } from "./alt-dialog";
import {
  formatRelativeTime,
  type PostCardProps,
  QuotedPost,
} from "./post-card";

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
  const [showRules, setShowRules] = useState(false);
  const canSetReplyRules = target?.type !== "reply";
  const [images, setImages] = useState<
    { file: File; url: string; alt: string }[]
  >([]);
  const [editingAlt, setEditingAlt] = useState<number>();
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
          images.forEach(({ file, alt }) => {
            formData.append("image", file);
            formData.append("alt", alt);
          });
          if (canSetReplyRules && allow) {
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
                {images.map(({ file, url, alt }, i) => (
                  <div
                    key={url}
                    className="relative overflow-hidden rounded-xl"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`画像${i + 1}のALTを編集`}
                      className={clsx(
                        `
                          absolute bottom-2 left-2 h-6 rounded-full border px-2
                          text-caption
                        `,
                        alt
                          ? "border-line bg-surface text-ink"
                          : "border-brand bg-brand font-bold text-on-brand",
                      )}
                      onClick={() => setEditingAlt(i)}
                    >
                      {alt ? "ALT" : "+ ALT"}
                    </button>
                    <button
                      type="button"
                      aria-label={`画像${i + 1}を削除`}
                      className={`
                        absolute top-2 right-2 flex size-8 items-center
                        justify-center rounded-full border border-line
                        bg-surface text-ink
                      `}
                      onClick={() =>
                        setImages(images.filter((it) => it.file !== file))
                      }
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {target?.type === "quote" && <QuotedPost quote={target.post} />}
          </div>
        </div>
        <div
          className={`
            flex items-center gap-3 border-t border-line pt-3 text-label
            text-muted
          `}
        >
          <label
            className={clsx(
              buttonClass({ variant: "secondary", size: "sm" }),
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
                  alt: "",
                }));
                setImages([...images, ...files].slice(0, MAX_IMAGES));
                e.target.value = "";
              }}
            />
          </label>
          {canSetReplyRules && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-expanded={showRules}
              onClick={() => setShowRules(!showRules)}
            >
              <Globe className="size-4" />
              {allow === undefined
                ? "誰でも返信できます"
                : allow.length === 0
                  ? "返信不可"
                  : "一部の人が返信できます"}
            </Button>
          )}
          {error && <span className="text-danger">{error}</span>}
          <span
            className={clsx(
              "ml-auto",
              length > MAX_POST_LENGTH && "text-danger",
            )}
          >
            {length}/{MAX_POST_LENGTH}
          </span>
        </div>
        {canSetReplyRules && showRules && (
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
        )}
      </form>
      {editingAlt !== undefined && images[editingAlt] && (
        <AltDialog
          imageUrl={images[editingAlt].url}
          defaultValue={images[editingAlt].alt}
          onClose={() => setEditingAlt(undefined)}
          onSave={(alt) => {
            setImages(
              images.map((it, i) => (i === editingAlt ? { ...it, alt } : it)),
            );
            setEditingAlt(undefined);
          }}
        />
      )}
    </Dialog>
  );
}
