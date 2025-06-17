import type { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@repo/client/server";
import type { Post } from "@repo/common/domain";
import { required } from "@repo/common/utils";

import type { IPostRepository } from "./interfaces/post-repository.js";
import {
  type AtUriService,
  AtUriServiceError,
} from "./service/at-uri-service.js";
import type { PostViewService } from "./service/post-view-service.js";

export class GetPostThreadUseCase {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
    private readonly atUriService: AtUriService,
  ) {}
  static inject = [
    "postRepository",
    "postViewService",
    "atUriService",
  ] as const;

  async execute(params: {
    uri: AtUri;
    depth: number;
    parentHeight: number;
  }): Promise<AppBskyFeedGetPostThread.OutputSchema> {
    // at://example.com/app.bsky.feed.post/12345 の形式でリクエストが来る場合があるので解決する
    let targetUri;
    try {
      targetUri = await this.atUriService.resolveHostname(params.uri);
    } catch (error) {
      // DB上のデータでハンドル解決出来ない場合は投稿も存在しないはずなのでnotFoundPostで返す
      if (error instanceof AtUriServiceError) {
        return { thread: this.notFoundPost(params.uri) };
      }
      throw error;
    }

    const targetPost = await this.postRepository.findByUri(targetUri);
    if (!targetPost) {
      return { thread: this.notFoundPost(targetUri) };
    }

    const parentThread = await this.collectParentPosts(
      targetPost,
      params.parentHeight,
    );
    const childThreads = await this.collectChildPosts(targetPost, params.depth);
    const targetPostThread = await this.buildThreadViewPost(targetPost);

    return {
      thread: {
        ...targetPostThread,
        parent: parentThread,
        replies: childThreads,
      },
    };
  }

  private notFoundPost(uri: AtUri): $Typed<AppBskyFeedDefs.NotFoundPost> {
    return {
      $type: "app.bsky.feed.defs#notFoundPost" as const,
      uri: uri.toString(),
      notFound: true,
    };
  }

  private async collectParentPosts(
    post: Post,
    maxDepth: number,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost> | undefined> {
    if (maxDepth <= 0) {
      return undefined;
    }

    // 再帰的に親投稿を取得する。投稿は[直接の親, さらに親 ... ルート投稿]の順
    const parentPosts = await this.findParentPosts(post, maxDepth);
    if (parentPosts.length === 0) {
      return undefined;
    }

    const parentThreads = await this.buildThreadViewPosts(parentPosts);

    // parentThreadsが配列 [A, B, C] のとき、以下のような構造を作成する
    //
    //  {
    //    "$type": "app.bsky.feed.defs#threadViewPost",
    //    "post": { A },
    //    "parent": {
    //      "$type": "app.bsky.feed.defs#threadViewPost",
    //      "post": { B },
    //      "parent": {
    //        "$type": "app.bsky.feed.defs#threadViewPost",
    //        "post": { C },
    //      },
    //    }
    //  }
    //
    return parentThreads.reduceRight<
      $Typed<AppBskyFeedDefs.ThreadViewPost> | undefined
    >(
      (parentChain, currentParent) => ({
        ...currentParent,
        parent: parentChain,
      }),
      undefined,
    );
  }

  private async findParentPosts(post: Post, maxDepth: number): Promise<Post[]> {
    if (!post.replyParent || maxDepth <= 0) {
      return [];
    }

    const parentPost = await this.postRepository.findByUri(
      post.replyParent.uri,
    );

    if (!parentPost) {
      return [];
    }

    const moreParentPosts = await this.findParentPosts(
      parentPost,
      maxDepth - 1,
    );
    return [parentPost, ...moreParentPosts];
  }

  private async collectChildPosts(
    post: Post,
    maxDepth: number,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost>[]> {
    if (maxDepth <= 0) {
      return [];
    }

    const directReplies = await this.postRepository.findReplies(post.uri);

    return Promise.all(
      directReplies.map((reply) =>
        this.buildChildPostChain(reply, maxDepth - 1),
      ),
    );
  }

  private async buildChildPostChain(
    reply: Post,
    maxDepth: number,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost>> {
    const threadViewPost = await this.buildThreadViewPost(reply);

    // ここで再帰的に子投稿を収集しているので、childRepliesは以下のようになる
    //
    //  [
    //    {
    //      "$type": "app.bsky.feed.defs#threadViewPost",
    //      "post": reply,
    //      "replies": [ ...replyの子投稿の配列 ]
    //    }
    //  ]
    //
    const childReplies = await this.collectChildPosts(reply, maxDepth);

    return {
      ...threadViewPost,
      replies: childReplies,
    };
  }

  private async buildThreadViewPosts(
    posts: Post[],
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost>[]> {
    if (posts.length === 0) {
      return [];
    }

    const postViews = await this.postViewService.findPostView(
      posts.map((post) => post.uri),
    );

    return postViews.map((postView) => {
      return {
        $type: "app.bsky.feed.defs#threadViewPost" as const,
        post: postView,
      };
    });
  }

  private async buildThreadViewPost(
    post: Post,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost>> {
    const result = await this.buildThreadViewPosts([post]);
    return required(result[0]);
  }
}
