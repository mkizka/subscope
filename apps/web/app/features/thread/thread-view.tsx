import { ArrowLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { Avatar } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { useMe } from "@/app/features/navigation/side-nav-container";
import {
  ExternalCard,
  PostCard,
  type PostCardProps,
  QuotedFeed,
  QuotedPost,
  UnavailableQuote,
} from "@/app/features/post/post-card";
import { useCompose } from "@/app/features/post/post-form-container";
import { PostImages } from "@/app/features/post/post-images";
import { PostToolbarContainer } from "@/app/features/post/post-toolbar-container";
import { PostVideo } from "@/app/features/post/post-video";
import { ProfileLink } from "@/app/features/post/profile-link";
import { RichText } from "@/app/features/post/rich-text";
import {
  threadPath,
  type TimelinePost,
} from "@/app/features/timeline/timeline-feed";
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
  video,
  external,
  quote,
  quoteUnavailable,
  quotedFeed,
  createdAt,
  replyCount,
  repostCount,
  quoteCount,
  likeCount,
  toolbar,
  ...post
}: TimelinePost & { toolbar: ReactNode }) {
  const hydrated = useHydrated();
  const counts = [
    { count: replyCount, label: "返信" },
    {
      count: repostCount,
      label: "リポスト",
      to: `${threadPath({ authorHandle, ...post })}/reposted-by`,
    },
    {
      count: quoteCount,
      label: "引用",
      to: `${threadPath({ authorHandle, ...post })}/quotes`,
    },
    {
      count: likeCount,
      label: "いいね",
      to: `${threadPath({ authorHandle, ...post })}/liked-by`,
    },
  ].filter(({ count }) => !!count);
  return (
    <article
      aria-label="選んだ投稿"
      className="border-b border-line px-4 pt-3 pb-2"
    >
      <ProfileLink
        handle={authorHandle}
        className="
          flex w-fit items-center gap-3
          hover:underline
        "
      >
        <Avatar src={authorAvatar} />
        <div className="min-w-0">
          <div className="truncate text-body font-bold">
            {authorDisplayName ?? authorHandle}
          </div>
          <div className="truncate text-label text-muted">@{authorHandle}</div>
        </div>
      </ProfileLink>
      <p className="mt-3 text-body-lg wrap-break-word whitespace-pre-wrap">
        {text && <RichText text={text} links={links} />}
      </p>
      {images && <PostImages images={images} />}
      {video && <PostVideo video={video} />}
      {external && <ExternalCard external={external} />}
      {quote && <QuotedPost quote={quote} />}
      {quoteUnavailable && <UnavailableQuote reason={quoteUnavailable} />}
      {quotedFeed && <QuotedFeed feed={quotedFeed} />}
      {createdAt && (
        <time
          dateTime={createdAt}
          className="mt-2 block border-b border-line py-2 text-label text-muted"
        >
          {hydrated &&
            new Date(createdAt).toLocaleString("ja-JP", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
        </time>
      )}
      {counts.length > 0 && (
        <div className="flex gap-4 border-b border-line py-2 text-label text-muted">
          {counts.map(({ count, label, to }) => {
            const content = (
              <>
                <b className="text-ink">{count}</b>件の{label}
              </>
            );
            return to ? (
              <Link key={label} to={to} className="hover:underline">
                {content}
              </Link>
            ) : (
              <span key={label}>{content}</span>
            );
          })}
        </div>
      )}
      <div className="mt-2">{toolbar}</div>
    </article>
  );
}

function ConnectedPost(props: PostCardProps) {
  return (
    <div className="relative">
      <div className="absolute top-12 -bottom-1 left-8 w-0.5 bg-line" />
      <PostCard {...props} />
    </div>
  );
}

function ReplyPrompt({ post }: { post: TimelinePost }) {
  const me = useMe();
  const openCompose = useCompose();
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <Avatar src={me?.avatarUrl} />
      <button
        type="button"
        className="
          flex-1 rounded-full bg-surface-2 px-4 py-2 text-left text-body
          text-muted
          hover:bg-line
        "
        onClick={() =>
          openCompose({
            type: "reply",
            uri: post.uri,
            cid: post.cid,
            post,
            root: post.replyRoot,
          })
        }
      >
        返信を書く
      </button>
    </div>
  );
}

function BackButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      aria-label="戻る"
      onClick={() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        window.history.state?.idx > 0 ? navigate(-1) : navigate("/")
      }
    >
      <ArrowLeftIcon className="size-4" />
    </Button>
  );
}

export function ThreadView({ thread }: Props) {
  const toolbar = (post: TimelinePost) => <PostToolbarContainer {...post} />;
  return (
    <section aria-label="スレッド" className="flex flex-col">
      <header
        className="
          sticky top-0 z-sticky flex items-center gap-2 border-b border-line
          bg-surface px-4 py-3
        "
      >
        <BackButton />
        <h1 className="text-title">スレッド</h1>
      </header>
      {thread.ancestors.map((post) => (
        <ConnectedPost
          key={post.uri}
          {...post}
          toolbar={toolbar(post)}
          threadPath={threadPath(post)}
        />
      ))}
      <FocusedPost
        {...thread.post}
        toolbar={<PostToolbarContainer {...thread.post} deleteRedirectTo="/" />}
      />
      <ReplyPrompt post={thread.post} />
      {thread.replies.map((chain) =>
        chain.map((post, i) =>
          i < chain.length - 1 ? (
            <ConnectedPost
              key={post.uri}
              {...post}
              toolbar={toolbar(post)}
              threadPath={threadPath(post)}
            />
          ) : (
            <PostCard
              key={post.uri}
              {...post}
              toolbar={toolbar(post)}
              threadPath={threadPath(post)}
            />
          ),
        ),
      )}
    </section>
  );
}
