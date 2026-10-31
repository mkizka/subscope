import type { $OutputBody } from "@repo/client/lex/app/bsky/feed/searchPosts";

import type { PostSearchService } from "../../../application/service/search/post-search-service.js";
import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type SearchPostsParams = {
  q: string;
  limit: number;
  cursor?: string;
};

export class SearchPostsUseCase {
  constructor(
    private readonly searchService: PostSearchService,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly postViews: PostViews,
  ) {}

  async execute(params: SearchPostsParams): Promise<$OutputBody> {
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

    const ctx = this.viewContextFactory.create();
    const posts = await Promise.all(
      paginationResult.items.map((post) =>
        this.postViews.postView(post.uri.toString(), ctx),
      ),
    );

    return {
      posts: posts.filter((post) => post !== undefined),
      cursor: paginationResult.cursor,
    };
  }
}
