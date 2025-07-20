import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedGetPostThread,
} from "@repo/client/server";
import type { Post } from "@repo/common/domain";

import type { ResolvedAtUri } from "../../../domain/models/at-uri.js";
import { type AtUriService } from "../../../domain/service/at-uri-service.js";
import type { IPostRepository } from "../../interfaces/post-repository.js";
import type { PostViewService } from "../../service/feed/post-view-service.js";
import { toMapByUri } from "../../utils/map.js";

type ThreadViewPost = $Typed<AppBskyFeedDefs.ThreadViewPost>;
type PostView = $Typed<AppBskyFeedDefs.PostView>;
type NotFoundPost = $Typed<AppBskyFeedDefs.NotFoundPost>;

const MAX_REPLIES_PER_POST = 20;

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
    uri: ResolvedAtUri;
    depth: number;
    parentHeight: number;
  }): Promise<AppBskyFeedGetPostThread.OutputSchema> {
    // 1. ターゲット投稿を取得
    const targetPost = await this.postRepository.findByUri(
      params.uri.getValue(),
    );
    if (!targetPost) {
      return { thread: this.notFoundPost(params.uri.getValue()) };
    }

    // 2. スレッド全体の構造を収集
    const threadData = await this.collectThreadData({
      targetPost,
      parentHeight: params.parentHeight,
      replyDepth: params.depth,
    });

    // 3. すべての投稿のPostViewを一括取得
    const postViewMap = await this.hydratePostViewMap(threadData.allPostUris);

    // 4. ターゲット投稿のPostViewを確認
    const targetPostView = postViewMap.get(targetPost.uri.toString());
    if (!targetPostView) {
      return { thread: this.notFoundPost(targetPost.uri) };
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

  private notFoundPost(uri: AtUri): NotFoundPost {
    const result: NotFoundPost = {
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: uri.toString(),
      notFound: true,
    };
    return result;
  }

  private async collectThreadData(params: {
    targetPost: Post;
    parentHeight: number;
    replyDepth: number;
  }): Promise<{
    parentPosts: Post[];
    allPostUris: Set<string>;
    replyTree: Map<string, Post[]>;
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
  ): Promise<Map<string, PostView>> {
    const uriArray = Array.from(uris).map((uri) => new AtUri(uri));
    return await this.postViewService.findPostView(uriArray).then(toMapByUri);
  }

  private buildThreadStructure({
    targetPost,
    targetPostView,
    parentPosts,
    replyDepth,
    postViewMap,
    replyTree,
  }: {
    targetPost: Post;
    targetPostView: PostView;
    parentPosts: Post[];
    replyDepth: number;
    postViewMap: Map<string, PostView>;
    replyTree: Map<string, Post[]>;
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
    post: Post,
    remainingHeight: number,
  ): Promise<Post[]> {
    if (!post.replyParent || remainingHeight <= 0) {
      return [];
    }

    const parentPost = await this.postRepository.findByUri(
      post.replyParent.uri,
    );
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
    post: Post,
    remainingDepth: number,
    structure: Map<string, Post[]> = new Map(),
  ): Promise<Map<string, Post[]>> {
    if (remainingDepth <= 0) {
      return structure;
    }

    const directReplies = await this.postRepository.findReplies(
      post.uri,
      MAX_REPLIES_PER_POST,
    );
    structure.set(post.uri.toString(), directReplies);

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
    targetPost: Post;
    parentPosts: Post[];
    replyTree: Map<string, Post[]>;
  }): Set<string> {
    const uris = new Set<string>();
    uris.add(targetPost.uri.toString());

    for (const post of parentPosts) {
      uris.add(post.uri.toString());
    }

    for (const replies of replyTree.values()) {
      replies.forEach((reply) => uris.add(reply.uri.toString()));
    }
    return uris;
  }

  private buildParentThread(
    parentPosts: Post[],
    postViewMap: Map<string, PostView>,
  ): ThreadViewPost | undefined {
    if (parentPosts.length === 0) {
      return undefined;
    }

    const threadViews = parentPosts
      .map((post) => {
        const postView = postViewMap.get(post.uri.toString());
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
    post: Post,
    remainingDepth: number,
    postViewMap: Map<string, PostView>,
    replyTree: Map<string, Post[]>,
  ): ThreadViewPost[] {
    if (remainingDepth <= 0) {
      return [];
    }

    const directReplies = replyTree.get(post.uri.toString()) ?? [];

    return directReplies
      .map((reply) => {
        const postView = postViewMap.get(reply.uri.toString());
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
