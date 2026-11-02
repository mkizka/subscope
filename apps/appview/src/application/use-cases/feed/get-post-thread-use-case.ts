import type { Did } from "@atproto/did";
import type { $Typed } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";
import type * as AppBskyFeedGetPostThread from "@repo/client/lex/app/bsky/feed/getPostThread";

import type { PostDto } from "../../../application/dto/post-dto.js";
import type { ResolvedAtUri } from "../../../domain/models/at-uri.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type ThreadViewPost = $Typed<AppBskyFeedDefs.ThreadViewPost>;
type PostView = $Typed<AppBskyFeedDefs.PostView>;

const MAX_REPLIES_PER_POST = 20;

export class PostNotFoundError extends Error {
  constructor(uri: AtUri) {
    super(`Post not found: ${uri.toString()}`);
    this.name = "NotFound";
  }
}

export class GetPostThreadUseCase {
  constructor(
    private readonly postQuery: IPostQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly postViews: PostViews,
  ) {}

  async execute(params: {
    uri: ResolvedAtUri;
    depth: number;
    parentHeight: number;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetPostThread.$OutputBody> {
    // 1. ターゲット投稿を取得
    const [targetPost] = await this.postQuery.findByUris([
      params.uri.getValue(),
    ]);
    if (!targetPost) {
      throw new PostNotFoundError(params.uri.getValue());
    }

    // 2. スレッド全体の構造を収集
    const threadData = await this.collectThreadData({
      targetPost,
      parentHeight: params.parentHeight,
      replyDepth: params.depth,
    });

    // 3. すべての投稿のPostViewを一括取得
    const postViewMap = await this.hydratePostViewMap(
      threadData.allPostUris,
      params.viewerDid,
    );

    // 4. ターゲット投稿のPostViewを確認
    const targetPostView = postViewMap.get(targetPost.uri);
    if (!targetPostView) {
      throw new PostNotFoundError(params.uri.getValue());
    }

    // 5. スレッド構造を構築して返す
    return {
      thread: this.buildThreadStructure({
        targetPost,
        targetPostView,
        parentPosts: threadData.parentPosts,
        replyDepth: params.depth,
        postViewMap,
        replyTree: threadData.replyTree,
      }),
    };
  }

  private async collectThreadData(params: {
    targetPost: PostDto;
    parentHeight: number;
    replyDepth: number;
  }): Promise<{
    parentPosts: PostDto[];
    allPostUris: Set<string>;
    replyTree: Map<string, PostDto[]>;
  }> {
    const { targetPost, parentHeight, replyDepth } = params;

    const parentPosts = await this.collectParentChain(targetPost, parentHeight);
    const replyTree = await this.collectReplyTree(targetPost, replyDepth);

    const allPostUris = this.aggregateAllUris({
      targetPost,
      parentPosts,
      replyTree,
    });

    return { parentPosts, allPostUris, replyTree };
  }

  private async hydratePostViewMap(
    uris: Set<string>,
    viewerDid?: Did,
  ): Promise<Map<string, PostView>> {
    const ctx = this.viewContextFactory.create({ viewerDid });
    const views = await Promise.all(
      Array.from(uris, (uri) => this.postViews.postView(uri, ctx)),
    );
    return new Map(
      views
        .filter((view) => view !== undefined)
        .map((view) => [view.uri, view]),
    );
  }

  private buildThreadStructure({
    targetPost,
    targetPostView,
    parentPosts,
    replyDepth,
    postViewMap,
    replyTree,
  }: {
    targetPost: PostDto;
    targetPostView: PostView;
    parentPosts: PostDto[];
    replyDepth: number;
    postViewMap: Map<string, PostView>;
    replyTree: Map<string, PostDto[]>;
  }): ThreadViewPost {
    const parentThread = this.buildParentThread(parentPosts, postViewMap);
    const replyThreads = this.buildReplyThreads(
      targetPost,
      replyDepth,
      postViewMap,
      replyTree,
    );

    return {
      $type: "app.bsky.feed.defs#threadViewPost",
      post: targetPostView,
      parent: parentThread,
      replies: replyThreads,
    };
  }

  private async collectParentChain(
    post: PostDto,
    remainingHeight: number,
  ): Promise<PostDto[]> {
    if (!post.replyParentUri || remainingHeight <= 0) {
      return [];
    }

    const [parentPost] = await this.postQuery.findByUris([
      new AtUri(post.replyParentUri),
    ]);
    if (!parentPost) {
      return [];
    }

    const ancestorPosts = await this.collectParentChain(
      parentPost,
      remainingHeight - 1,
    );

    return [parentPost, ...ancestorPosts];
  }

  // 各リプライについてリプライのuriをキーとし、リプライへのリプライの配列を値とするMapを返す
  // buildReplyThreadsでリプライスレッドを再構築する際に使用する
  private async collectReplyTree(
    post: PostDto,
    remainingDepth: number,
    structure: Map<string, PostDto[]> = new Map(),
  ): Promise<Map<string, PostDto[]>> {
    if (remainingDepth <= 0) {
      return structure;
    }

    const directReplies = await this.postQuery.findReplies(
      new AtUri(post.uri),
      MAX_REPLIES_PER_POST,
    );
    structure.set(post.uri, directReplies);

    await Promise.all(
      directReplies.map((reply) =>
        this.collectReplyTree(reply, remainingDepth - 1, structure),
      ),
    );

    return structure;
  }

  private aggregateAllUris({
    targetPost,
    parentPosts,
    replyTree,
  }: {
    targetPost: PostDto;
    parentPosts: PostDto[];
    replyTree: Map<string, PostDto[]>;
  }): Set<string> {
    const uris = new Set<string>();
    uris.add(targetPost.uri);

    for (const post of parentPosts) {
      uris.add(post.uri);
    }

    for (const replies of replyTree.values()) {
      replies.forEach((reply) => uris.add(reply.uri));
    }
    return uris;
  }

  private buildParentThread(
    parentPosts: PostDto[],
    postViewMap: Map<string, PostView>,
  ): ThreadViewPost | undefined {
    if (parentPosts.length === 0) {
      return undefined;
    }

    const threadViews = parentPosts
      .map((post) => {
        const postView = postViewMap.get(post.uri);
        if (!postView) return null;

        return {
          $type: "app.bsky.feed.defs#threadViewPost" as const,
          post: postView,
        };
      })
      .filter((view) => view !== null);

    // threadViewsは[親、親の親、親の親の親...]の順
    // 一番上の親から逆方向に組み上げていく(最初のchildThreadはundefined)のでreduceRightを使用
    return threadViews.reduceRight<ThreadViewPost | undefined>(
      (childThread, currentThread) => ({
        ...currentThread,
        parent: childThread,
      }),
      undefined,
    );
  }

  private buildReplyThreads(
    post: PostDto,
    remainingDepth: number,
    postViewMap: Map<string, PostView>,
    replyTree: Map<string, PostDto[]>,
  ): ThreadViewPost[] {
    if (remainingDepth <= 0) {
      return [];
    }

    const directReplies = replyTree.get(post.uri) ?? [];

    return directReplies
      .map((reply) => {
        const postView = postViewMap.get(reply.uri);
        if (!postView) return null;

        const nestedReplies = this.buildReplyThreads(
          reply,
          remainingDepth - 1,
          postViewMap,
          replyTree,
        );

        return {
          $type: "app.bsky.feed.defs#threadViewPost" as const,
          post: postView,
          replies: nestedReplies,
        };
      })
      .filter((thread) => thread !== null);
  }
}
