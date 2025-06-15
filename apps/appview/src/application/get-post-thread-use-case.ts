import type { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@repo/client/server";
import type { Post } from "@repo/common/domain";
import type { LoggerManager } from "@repo/common/infrastructure";
import { required } from "@repo/common/utils";

import type { IPostRepository } from "./interfaces/post-repository.js";
import {
  type AtUriService,
  AtUriServiceError,
} from "./service/at-uri-service.js";
import type { PostViewService } from "./service/post-view-service.js";

export class GetPostThreadUseCase {
  private readonly logger;

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
    private readonly atUriService: AtUriService,
    private readonly loggerManager: LoggerManager,
  ) {
    this.logger = this.loggerManager.createLogger("GetPostThreadUseCase");
  }
  static inject = [
    "postRepository",
    "postViewService",
    "atUriService",
    "loggerManager",
  ] as const;

  async execute(params: {
    uri: AtUri;
    depth: number;
    parentHeight: number;
  }): Promise<AppBskyFeedGetPostThread.OutputSchema> {
    const startTime = Date.now();
    const performanceLog: Record<string, number> = {};

    // at://example.com/app.bsky.feed.post/12345 の形式でリクエストが来る場合があるので解決する
    let targetUri;
    const resolveStart = Date.now();
    try {
      targetUri = await this.atUriService.resolveHostname(params.uri);
    } catch (error) {
      // DB上のデータでハンドル解決出来ない場合は投稿も存在しないはずなのでnotFoundPostで返す
      if (error instanceof AtUriServiceError) {
        return { thread: this.notFoundPost(params.uri) };
      }
      throw error;
    }
    performanceLog.resolveHostname = Date.now() - resolveStart;

    const findPostStart = Date.now();
    const targetPost = await this.postRepository.findByUri(targetUri);
    performanceLog.findTargetPost = Date.now() - findPostStart;

    if (!targetPost) {
      return { thread: this.notFoundPost(targetUri) };
    }

    const parentStart = Date.now();
    const parentThread = await this.collectParentPosts(
      targetPost.uri,
      params.parentHeight,
    );
    performanceLog.collectParentPosts = Date.now() - parentStart;

    const childStart = Date.now();
    const childThreads = await this.collectChildPosts(
      targetPost.uri,
      params.depth,
    );
    performanceLog.collectChildPosts = Date.now() - childStart;

    const buildStart = Date.now();
    const targetPostThread = await this.buildThreadViewPost(targetPost);
    performanceLog.buildTargetPost = Date.now() - buildStart;

    performanceLog.total = Date.now() - startTime;

    this.logger.info("performance", {
      uri: params.uri.toString(),
      depth: params.depth,
      parentHeight: params.parentHeight,
      ...performanceLog,
    });

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
    uri: AtUri,
    maxDepth: number,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost> | undefined> {
    if (maxDepth <= 0) {
      return undefined;
    }

    // 再帰的に親投稿を取得する。投稿は[直接の親, さらに親 ... ルート投稿]の順
    const parentPosts = await this.findParentPosts(uri, maxDepth);
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
    return parentThreads.reduce<
      $Typed<AppBskyFeedDefs.ThreadViewPost> | undefined
    >(
      (parentChain, currentParent) => ({
        ...currentParent,
        parent: parentChain,
      }),
      undefined,
    );
  }

  private async findParentPosts(uri: AtUri, maxDepth: number): Promise<Post[]> {
    const currentPost = await this.postRepository.findByUri(uri);

    if (!currentPost?.replyParent || maxDepth <= 0) {
      return [];
    }

    const parentPost = await this.postRepository.findByUri(
      currentPost.replyParent.uri,
    );

    if (!parentPost) {
      return [];
    }

    const moreParentPosts = await this.findParentPosts(
      parentPost.uri,
      maxDepth - 1,
    );
    return [parentPost, ...moreParentPosts];
  }

  private async collectChildPosts(
    uri: AtUri,
    maxDepth: number,
  ): Promise<$Typed<AppBskyFeedDefs.ThreadViewPost>[]> {
    if (maxDepth <= 0) {
      return [];
    }

    const directReplies = await this.postRepository.findReplies(uri);

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
    const childReplies = await this.collectChildPosts(reply.uri, maxDepth);

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
