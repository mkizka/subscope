import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

import { PostToolbarContainer } from "@/app/features/timeline/blocks/post-toolbar-container";
import type { TimelinePost } from "@/app/features/timeline/blocks/timeline-feed";
import {
  ExternalCard,
  PostCard,
  type PostCardProps,
  QuotedPost,
} from "@/app/features/timeline/parts/post-card";
import { PostImages } from "@/app/features/timeline/parts/post-images";
import { ProfileLink } from "@/app/features/timeline/parts/profile-link";
import { RichText } from "@/app/features/timeline/parts/rich-text";
import { useHydrated } from "@/app/lib/use-hydrated";

type Props = {
  thread: {
    ancestors: TimelinePost[];
    post: TimelinePost;
    replies: TimelinePost[][];
  };
};

function FocusedPost({
  authorAvatar,
  authorDisplayName,
  authorHandle,
  text,
  links,
  images,
  external,
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
      <ProfileLink
        handle={authorHandle}
        className="
          flex w-fit items-center gap-3
          hover:underline
        "
      >
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
      </ProfileLink>
      <p className="mt-2 text-lg wrap-break-word whitespace-pre-wrap">
        {text && <RichText text={text} links={links} />}
      </p>
      {images && <PostImages images={images} />}
      {external && <ExternalCard external={external} />}
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

function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="戻る"
      className="btn btn-square btn-ghost btn-sm"
      onClick={() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        window.history.state?.idx > 0 ? navigate(-1) : navigate("/")
      }
    >
      <ArrowLeftIcon className="size-4" />
    </button>
  );
}

export function ThreadView({ thread }: Props) {
  const toolbar = (post: TimelinePost) => <PostToolbarContainer {...post} />;
  return (
    <section aria-label="スレッド" className="flex flex-col">
      <header className="flex items-center gap-2 border-b border-base-300 p-2">
        <BackButton />
        <h1 className="font-bold">スレッド</h1>
      </header>
      {thread.ancestors.map((post) => (
        <ConnectedPost key={post.uri} {...post} toolbar={toolbar(post)} />
      ))}
      <FocusedPost {...thread.post} toolbar={toolbar(thread.post)} />
      {thread.replies.map((chain) =>
        chain.map((post, i) =>
          i < chain.length - 1 ? (
            <ConnectedPost key={post.uri} {...post} toolbar={toolbar(post)} />
          ) : (
            <PostCard key={post.uri} {...post} toolbar={toolbar(post)} />
          ),
        ),
      )}
    </section>
  );
}
