import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyActorDefs,
  AppBskyFeedDefs,
} from "@repo/client/server";
import type { FeedItem } from "@repo/common/domain";

import type { IPostRepository } from "../interfaces/post-repository.js";
import type { Page } from "../utils/pagination.js";
import type { PostViewService } from "./post-view-service.js";
import type { ProfileViewService } from "./profile-view-service.js";
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

    const { postViewMap, profileViewBasicMap, replyRefMap } =
      await this.fetchViewData(postUris, repostActorDids);

    const feed = this.buildFeedItems(
      paginationResult.items,
      postViewMap,
      profileViewBasicMap,
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

  private async fetchViewData(postUris: AtUri[], repostActorDids: Did[]) {
    const posts = await this.postRepository.findByUris(postUris);
    const [postViews, replyRefMap, repostProfiles] = await Promise.all([
      this.postViewService.findPostView(postUris),
      this.replyRefService.createReplyRefs(posts),
      this.profileViewService.findProfileViewBasic(repostActorDids),
    ]);

    const postViewMap = new Map(postViews.map((pv) => [pv.uri, pv]));
    const profileViewBasicMap = new Map(repostProfiles.map((p) => [p.did, p]));

    return { postViewMap, profileViewBasicMap, replyRefMap };
  }

  private buildFeedItems(
    items: FeedItem[],
    postViewMap: Map<string, $Typed<AppBskyFeedDefs.PostView>>,
    profileViewBasicMap: Map<string, $Typed<AppBskyActorDefs.ProfileViewBasic>>,
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
          profileViewBasicMap,
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
    profileViewBasicMap: Map<string, AppBskyActorDefs.ProfileViewBasic>,
    replyRefMap: Map<string, AppBskyFeedDefs.ReplyRef | undefined>,
  ): $Typed<AppBskyFeedDefs.FeedViewPost> | null {
    if (item.subjectUri === null) return null;

    const postView = postViewMap.get(item.subjectUri);
    const profileViewBasic = profileViewBasicMap.get(item.actorDid);

    if (!postView || !profileViewBasic) return null;

    return {
      $type: "app.bsky.feed.defs#feedViewPost" as const,
      post: postView,
      reply: replyRefMap.get(postView.uri),
      reason: {
        $type: "app.bsky.feed.defs#reasonRepost" as const,
        by: profileViewBasic,
        indexedAt: item.sortAt.toISOString(),
      },
    };
  }
}
