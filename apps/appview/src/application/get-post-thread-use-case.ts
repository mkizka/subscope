import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyFeedDefs } from "@repo/client/server";
import type { Post } from "@repo/common/domain";

import type { IPostRepository } from "./interfaces/post-repository.js";
import type { PostViewService } from "./service/post-view-service.js";

type ThreadViewPost = AppBskyFeedDefs.ThreadViewPost;
type PostView = AppBskyFeedDefs.PostView;
type NotFoundPost = AppBskyFeedDefs.NotFoundPost;

export class GetPostThreadUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
  ) {}
  static inject = ["postRepository", "postViewService"] as const;

  async execute({
    uri,
    depth,
    parentHeight,
  }: {
    uri: AtUri;
    depth: number;
    parentHeight: number;
  }): Promise<{ thread: $Typed<ThreadViewPost> | $Typed<NotFoundPost> }> {
    const mainPost = await this.postRepository.findByUri(uri);
    if (!mainPost) {
      return {
        thread: {
          $type: "app.bsky.feed.defs#notFoundPost",
          uri: uri.toString(),
          notFound: true,
        },
      };
    }

    const parents = await this.postRepository.findParents(uri, parentHeight);
    const replies = await this.postRepository.findReplies(uri, depth);

    const allPosts = [mainPost, ...parents, ...replies];
    const postViews = await this.postViewService.findPostView(
      allPosts.map((post) => post.uri),
    );

    const getPostView = (post: Post): PostView | null => {
      return postViews.find((view) => view.uri === post.uri.toString()) || null;
    };

    const buildRepliesForPost = (post: Post): $Typed<ThreadViewPost>[] => {
      return replies
        .filter(
          (reply) => reply.replyParent?.uri.toString() === post.uri.toString(),
        )
        .map((reply) => {
          const postView = getPostView(reply);
          if (!postView) {
            throw new Error(`PostView not found for ${reply.uri.toString()}`);
          }

          return {
            $type: "app.bsky.feed.defs#threadViewPost" as const,
            post: postView,
            replies: buildRepliesForPost(reply),
          } satisfies $Typed<ThreadViewPost>;
        });
    };

    // メイン投稿のPostViewを取得
    const mainPostView = getPostView(mainPost);
    if (!mainPostView) {
      throw new Error(`PostView not found for ${mainPost.uri.toString()}`);
    }

    // 親投稿チェーンを構築
    let parentThread: $Typed<ThreadViewPost> | undefined;
    if (parents.length > 0) {
      // 最も古い親から順番に構築
      for (let i = 0; i < parents.length; i++) {
        const parent = parents[i];
        if (!parent) continue;

        const parentView = getPostView(parent);
        if (parentView) {
          const newParent: $Typed<ThreadViewPost> = {
            $type: "app.bsky.feed.defs#threadViewPost" as const,
            post: parentView,
            parent: parentThread,
          } satisfies $Typed<ThreadViewPost>;
          parentThread = newParent;
        }
      }
    }

    // メイン投稿のスレッドを構築
    const mainThread: $Typed<ThreadViewPost> = {
      $type: "app.bsky.feed.defs#threadViewPost" as const,
      post: mainPostView,
      parent: parentThread,
      replies: buildRepliesForPost(mainPost),
    } satisfies $Typed<ThreadViewPost>;

    return { thread: mainThread };
  }
}
