import type { $OutputBody } from "@repo/client/lex/app/bsky/feed/searchPosts";

import type { PostDto } from "../../dto/post-dto.js";
import type { IPostQuery } from "../../interfaces/post-query.js";
import { createCursorPaginator } from "../../utils/pagination.js";
import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type SearchPostsParams = {
  q: string;
  limit: number;
  cursor?: string;
};

export class SearchPostsUseCase {
  constructor(
    private readonly postQuery: IPostQuery,
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

    const paginator = createCursorPaginator<PostDto>({
      limit: params.limit,
      getCursor: (post) => post.sortAt.toISOString(),
    });
    const posts = await this.postQuery.search({
      query: params.q,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
    });
    const paginationResult = paginator.extractPage(posts);

    const ctx = this.viewContextFactory.create();
    const postViews = await Promise.all(
      paginationResult.items.map((post) =>
        this.postViews.postView(post.uri, ctx),
      ),
    );

    return {
      posts: postViews.filter((post) => post !== undefined),
      cursor: paginationResult.cursor,
    };
  }
}
