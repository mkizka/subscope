import type * as AppBskyFeedGetQuotes from "@repo/client/app/bsky/feed/getQuotes";

import type { PostDto } from "../../dto/post-dto.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import { createCursorPaginator } from "../../utils/pagination.js";
import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory, Viewer } from "../../views/view-context.js";

export class GetQuotesUseCase {
  constructor(
    private readonly deps: {
      postQuery: IPostQuery;
      viewContextFactory: ViewContextFactory;
      postViews: PostViews;
    },
  ) {}

  async execute(
    params: AppBskyFeedGetQuotes.$Params,
    viewer: Viewer,
  ): Promise<AppBskyFeedGetQuotes.$OutputBody> {
    const paginator = createCursorPaginator<PostDto>({
      limit: params.limit,
      getCursor: (post) => post.sortAt.toISOString(),
    });
    const paginationResult = paginator.extractPage(
      await this.deps.postQuery.findQuotes({
        uri: params.uri,
        limit: paginator.queryLimit,
        cursor: params.cursor ? new Date(params.cursor) : undefined,
      }),
    );

    const ctx = this.deps.viewContextFactory.create(viewer);
    const posts = await Promise.all(
      paginationResult.items.map((post) =>
        this.deps.postViews.postView(post.uri, ctx),
      ),
    );

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: paginationResult.cursor,
      posts: posts.filter((post) => post !== undefined),
    };
  }
}
