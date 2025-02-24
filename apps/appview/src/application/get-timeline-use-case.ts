import type { AppBskyFeedGetTimeline } from "@dawn/client";
import type { DatabaseClient } from "@dawn/common/domain";
import { required } from "@dawn/common/utils";

import type { IPostRepository } from "./interfaces/post-repository.js";
import type { PostViewService } from "./service/post-view-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
  ) {}
  static inject = ["db", "postRepository", "postViewService"] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const samplePosts = await this.postRepository.findMany({
      // TODO: サーバー側の型を利用するように修正(limitは必須になっている)
      limit: params.limit!,
    });
    const postViews = await this.postViewService.findPostView(
      samplePosts.map((post) => post.uri),
    );
    const replyUris = samplePosts.flatMap((post) =>
      [post.replyRoot?.uri, post.replyParent?.uri].filter(
        (uri) => uri !== undefined,
      ),
    );
    const replyPostViews = await this.postViewService.findPostView(replyUris);
    const feed = samplePosts.map((feedPost) => {
      const post = required(
        postViews.find((post) => post.uri === feedPost.uri.toString()),
      );
      const replyRoot = replyPostViews.find(
        (reply) => reply.uri === feedPost.replyRoot?.uri.toString(),
      );
      const replyParent = replyPostViews.find(
        (reply) => reply.uri === feedPost.replyParent?.uri.toString(),
      );
      if (replyRoot && replyParent) {
        return { post, reply: { root: replyRoot, parent: replyParent } };
      }
      return { post };
    });
    return {
      cursor: undefined, // TODO: 実装
      feed,
    };
  }
}
