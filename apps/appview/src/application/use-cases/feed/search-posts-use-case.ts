import type { $OutputBody } from "@repo/client/app/bsky/feed/searchPosts";

import type { PostDto } from "../../dto/post-dto.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import { createCursorPaginator } from "../../utils/pagination.js";
import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory, Viewer } from "../../views/view-context.js";

type SearchPostsParams = {
  q?: string;
  authorDids?: string[];
  replies?: "only" | "exclude";
  limit: number;
  cursor?: string;
};

export class SearchPostsUseCase {
  constructor(
    private readonly postQuery: IPostQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly postViews: PostViews,
  ) {}

  async execute(
    params: SearchPostsParams,
    viewer: Viewer,
  ): Promise<$OutputBody> {
    const terms = params.q?.split(/\s+/).filter(Boolean) ?? [];
    if (!terms.length && !params.authorDids?.length) {
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
      terms,
      authorDids: params.authorDids,
      replies: params.replies,
      limit: paginator.queryLimit,
      cursor: params.cursor ? new Date(params.cursor) : undefined,
    });
    const paginationResult = paginator.extractPage(posts);

    const ctx = this.viewContextFactory.create(viewer);
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
