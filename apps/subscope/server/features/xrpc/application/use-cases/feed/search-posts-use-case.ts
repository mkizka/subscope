import type { AppBskyFeedDefs } from "@repo/client/server";

import type { PostViewService } from "@/server/features/xrpc/application/service/feed/post-view-service.js";
import type { PostSearchService } from "@/server/features/xrpc/application/service/search/post-search-service.js";

type SearchPostsParams = {
  q: string;
  limit: number;
  cursor?: string;
};

type SearchPostsResult = {
  posts: AppBskyFeedDefs.PostView[];
  cursor?: string;
};

export class SearchPostsUseCase {
  constructor(
    private readonly searchService: PostSearchService,
    private readonly postViewService: PostViewService,
  ) {}
  static inject = ["searchService", "postViewService"] as const;

  async execute(params: SearchPostsParams): Promise<SearchPostsResult> {
    if (!params.q.trim()) {
      return {
        posts: [],
        cursor: undefined,
      };
    }

    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult = await this.searchService.findPostsWithPagination({
      query: params.q,
      cursor,
      limit: params.limit,
    });

    const posts = await this.postViewService.findPostView(
      paginationResult.items.map((post) => post.uri),
    );

    return {
      posts,
      cursor: paginationResult.cursor,
    };
  }
}
