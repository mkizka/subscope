import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyActorDefs,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { FeedItem } from "@repo/common/domain";

import type { IPostRepository } from "../../interfaces/post-repository.js";
import { toMapByDid, toMapByUri } from "../../utils/map.js";
import type { Page } from "../../utils/pagination.js";
import type { ProfileViewService } from "../actor/profile-view-service.js";
import type { PostViewService } from "./post-view-service.js";
import type { ReplyRefService } from "./reply-ref-service.js";

export class FeedProcessor {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
    private readonly replyRefService: ReplyRefService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = [
    "postRepository",
    "postViewService",
    "replyRefService",
    "profileViewService",
  ] as const;

  async processFeedItems(paginationResult: Page<FeedItem>): Promise<{
    feed: $Typed<AppBskyFeedDefs.FeedViewPost>[];
    cursor: string | undefined;
  }> {
    const { postUris, repostActorDids } = this.extractUrisAndActors(
      paginationResult.items,
    );

    const { postViewMap, replyRefMap, reposterProfileMap } =
      await this.fetchViewData(postUris, repostActorDids);

    const feed = this.buildFeedItems(
      paginationResult.items,
      postViewMap,
      reposterProfileMap,
      replyRefMap,
    );

    return {
      feed,
      cursor: paginationResult.cursor,
    };
  }

  private extractUrisAndActors(items: FeedItem[]) {
    const postUris: AtUri[] = [];
    const repostActorDids: Did[] = [];

    for (const item of items) {
      if (item.type === "post") {
        postUris.push(new AtUri(item.uri));
      } else if (item.subjectUri !== null) {
        postUris.push(new AtUri(item.subjectUri));
        repostActorDids.push(item.actorDid);
      }
    }

    return { postUris, repostActorDids };
  }

  private async fetchViewData(postUris: AtUri[], reposterDids: Did[]) {
    const posts = await this.postRepository.findByUris(postUris);

    const [postViewMap, replyRefMap, reposterProfileMap] = await Promise.all([
      this.postViewService.findPostView(postUris).then(toMapByUri),
      this.replyRefService.findMap(posts),
      this.profileViewService
        .findProfileViewBasic(reposterDids)
        .then(toMapByDid),
    ]);

    return { postViewMap, replyRefMap, reposterProfileMap };
  }

  private buildFeedItems(
    items: FeedItem[],
    postViewMap: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
    reposterProfileMap: Map<string, $Typed<AppBskyActorDefs.ProfileViewBasic>>,
    replyRefMap: Map<string, $Typed<AppBskyFeedDefs.ReplyRef>>,
  ): $Typed<AppBskyFeedDefs.FeedViewPost>[] {
    const feed: $Typed<AppBskyFeedDefs.FeedViewPost>[] = [];

    for (const item of items) {
      if (item.type === "post") {
        const feedItem = this.buildPostFeedItem(item, postViewMap, replyRefMap);
        if (feedItem) feed.push(feedItem);
      } else if (item.subjectUri !== null) {
        const feedItem = this.buildRepostFeedItem(
          item,
          postViewMap,
          reposterProfileMap,
          replyRefMap,
        );
        if (feedItem) feed.push(feedItem);
      }
    }

    return feed;
  }

  private buildPostFeedItem(
    item: FeedItem,
    postViewMap: Map<string, AppBskyFeedDefs.PostView>,
    replyRefMap: Map<string, AppBskyFeedDefs.ReplyRef | undefined>,
  ): $Typed<AppBskyFeedDefs.FeedViewPost> | null {
    const postView = postViewMap.get(item.uri);
    if (!postView) return null;

    return {
      $type: "app.bsky.feed.defs#feedViewPost" as const,
      post: postView,
      reply: replyRefMap.get(postView.uri),
    };
  }

  private buildRepostFeedItem(
    item: FeedItem,
    postViewMap: Map<string, AppBskyFeedDefs.PostView>,
    reposterProfileMap: Map<string, AppBskyActorDefs.ProfileViewBasic>,
    replyRefMap: Map<string, AppBskyFeedDefs.ReplyRef | undefined>,
  ): $Typed<AppBskyFeedDefs.FeedViewPost> | null {
    if (item.subjectUri === null) return null;

    const postView = postViewMap.get(item.subjectUri);
    const reposter = reposterProfileMap.get(item.actorDid);

    if (!postView || !reposter) return null;

    return {
      $type: "app.bsky.feed.defs#feedViewPost" as const,
      post: postView,
      reply: replyRefMap.get(postView.uri),
      reason: {
        $type: "app.bsky.feed.defs#reasonRepost" as const,
        by: reposter,
        indexedAt: item.sortAt.toISOString(),
      },
    };
  }
}
