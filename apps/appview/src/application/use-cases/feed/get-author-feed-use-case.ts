import { type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedGetAuthorFeed from "@repo/client/app/bsky/feed/getAuthorFeed";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { IAuthorFeedQuery } from "../../interfaces/queries/author-feed-query.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ProfileViews } from "../../views/profile-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type Filter = AppBskyFeedGetAuthorFeed.$Params["filter"];

type GetAuthorFeedParams = {
  accountDid: Did;
  limit: number;
  filter: Filter;
  includePins: boolean;
  cursor?: Date;
  viewerDid?: Did;
};

export class GetAuthorFeedUseCase {
  constructor(
    private readonly authorFeedQuery: IAuthorFeedQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly feedViews: FeedViews,
    private readonly profileViews: ProfileViews,
  ) {}

  async execute(
    params: GetAuthorFeedParams,
  ): Promise<AppBskyFeedGetAuthorFeed.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.findFeedItems(params.filter, {
      accountDid: params.accountDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
    });
    const page = paginator.extractPage(feedItems);

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const pinned =
      params.includePins && !params.cursor
        ? await this.profileViews.pinnedPost(params.accountDid, ctx)
        : undefined;
    const pinnedUri =
      pinned && new AtUri(pinned.uri).host === params.accountDid
        ? pinned.uri
        : undefined;
    const items: FeedItemDto[] = pinnedUri
      ? [
          {
            uri: pinnedUri,
            type: "post",
            subjectUri: null,
            accountDid: params.accountDid,
            sortAt: new Date(),
          },
          ...page.items.filter(
            (item) => item.type !== "post" || item.uri !== pinnedUri,
          ),
        ]
      : page.items;
    const feed = await Promise.all(
      items.map(async (item) => {
        const view = await this.feedViews.feedViewPost(item, ctx);
        return view && item.uri === pinnedUri && item.type === "post"
          ? {
              ...view,
              reason: {
                $type: "app.bsky.feed.defs#reasonPin" as const,
              },
            }
          : view;
      }),
    );

    return {
      feed: feed.filter((item) => item !== undefined),
      cursor: page.cursor,
    };
  }

  private findFeedItems(
    filter: Filter,
    params: { accountDid: Did; limit: number; cursor?: Date },
  ): Promise<FeedItemDto[]> {
    switch (filter) {
      case "posts_no_replies":
        return this.authorFeedQuery.findFeedItemsWithoutReplies(params);
      case "posts_with_media":
        return this.authorFeedQuery.findFeedItemsWithMedia(params);
      case "posts_with_video":
        return this.authorFeedQuery.findFeedItemsWithVideo(params);
      case "posts_and_author_threads":
        return this.authorFeedQuery.findFeedItemsWithAuthorThreads(params);
      default:
        return this.authorFeedQuery.findFeedItems(params);
    }
  }
}
