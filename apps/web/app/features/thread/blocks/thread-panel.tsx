import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import type { ComposeTarget } from "@/app/features/timeline/blocks/post-form-container";
import { PostToolbarContainer } from "@/app/features/timeline/blocks/post-toolbar-container";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import {
  PostCard,
  type PostCardProps,
  QuotedPost,
} from "@/app/features/timeline/parts/post-card";
import { useHydrated } from "@/app/lib/use-hydrated";

type Props = {
  thread?: {
    ancestors: TimelinePost[];
    post: TimelinePost;
    replies: TimelinePost[][];
  } | null;
  closeSearch: string;
  onCompose: (target: ComposeTarget) => void;
  form?: ReactNode;
};

function FocusedPost({
  authorAvatar,
  authorDisplayName,
  authorHandle,
  text,
  images,
  quote,
  createdAt,
  replyCount,
  repostCount,
  likeCount,
  toolbar,
}: TimelinePost & { toolbar: ReactNode }) {
  const hydrated = useHydrated();
  const counts = [
    { count: replyCount, label: "返信" },
    { count: repostCount, label: "リポスト" },
    { count: likeCount, label: "いいね" },
  ].filter(({ count }) => !!count);
  return (
    <article
      aria-label="選んだ投稿"
      className="border-b border-base-300 px-4 pt-2 pb-3"
    >
      <div className="flex items-center gap-3">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt=""
            className="size-9 rounded-md object-cover"
          />
        ) : (
          <div className="size-9 rounded-md bg-base-300" />
        )}
        <div className="min-w-0">
          <div className="truncate font-bold">
            {authorDisplayName ?? authorHandle}
          </div>
          <div className="truncate text-sm text-base-content/60">
            @{authorHandle}
          </div>
        </div>
      </div>
      <p className="mt-2 text-lg wrap-break-word whitespace-pre-wrap">{text}</p>
      {images && (
        <div className="mt-2 grid grid-cols-2 gap-1">
          {images.map((image) => (
            <img
              key={image.thumb}
              src={image.thumb}
              alt={image.alt}
              className="w-full rounded-sm object-cover"
            />
          ))}
        </div>
      )}
      {quote && <QuotedPost quote={quote} />}
      {createdAt && (
        <time
          dateTime={createdAt}
          className="mt-2 block text-sm text-base-content/60"
        >
          {hydrated &&
            new Date(createdAt).toLocaleString("ja-JP", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
        </time>
      )}
      {counts.length > 0 && (
        <div className="mt-2 flex gap-4 text-sm">
          {counts.map(({ count, label }) => (
            <span key={label}>
              <b>{count}</b>件の{label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2">{toolbar}</div>
    </article>
  );
}

function ConnectedPost(props: PostCardProps) {
  return (
    <div className="relative">
      <div
        className="
          absolute top-12 -bottom-1 left-[33px] w-0.5 bg-base-content/20
        "
      />
      <PostCard {...props} />
    </div>
  );
}

export function ThreadPanel({ thread, closeSearch, onCompose, form }: Props) {
  const toolbar = (post: TimelinePost) => (
    <PostToolbarContainer {...post} onCompose={onCompose} />
  );
  return (
    <section aria-label="スレッド" className="flex flex-col">
      <header
        className="
          flex items-center justify-between border-b border-base-300 py-1 pr-2
          pl-4
        "
      >
        <h2 className="font-bold">スレッド</h2>
        <Link
          to={{ search: closeSearch }}
          preventScrollReset
          aria-label="閉じる"
          className="btn btn-square btn-ghost btn-sm"
        >
          <XIcon className="size-4" />
        </Link>
      </header>
      {thread && (
        <>
          {thread.ancestors.map((post) => (
            <ConnectedPost key={post.uri} {...post} toolbar={toolbar(post)} />
          ))}
          <FocusedPost {...thread.post} toolbar={toolbar(thread.post)} />
          {thread.replies.map((chain) =>
            chain.map((post, i) =>
              i < chain.length - 1 ? (
                <ConnectedPost
                  key={post.uri}
                  {...post}
                  toolbar={toolbar(post)}
                />
              ) : (
                <PostCard key={post.uri} {...post} toolbar={toolbar(post)} />
              ),
            ),
          )}
        </>
      )}
      {form && (
        <div className="sticky bottom-0 border-t border-base-300 bg-base-100 p-3">
          {form}
        </div>
      )}
    </section>
  );
}
