import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedGetTimeline,
} from "@repo/client/server";

import type { IPostRepository } from "./interfaces/post-repository.js";
import type { PostViewService } from "./service/post-view-service.js";
import type { ProfileViewService } from "./service/profile-view-service.js";
import type { ReplyRefService } from "./service/reply-ref-service.js";
import type { TimelineService } from "./service/timeline-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
    private readonly replyRefService: ReplyRefService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = [
    "timelineService",
    "postRepository",
    "postViewService",
    "replyRefService",
    "profileViewService",
  ] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
    authDid: string,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult =
      await this.timelineService.findFeedItemsWithPagination({
        authDid,
        cursor,
        limit: params.limit,
      });

    // 投稿URIを収集（postとrepostの両方）
    const postUris: AtUri[] = [];
    const repostActorDids: Did[] = [];

    for (const item of paginationResult.items) {
      if (item.type === "post") {
        postUris.push(new AtUri(item.uri));
      } else if (item.subjectUri) {
        postUris.push(new AtUri(item.subjectUri));
        repostActorDids.push(item.actorDid);
      }
    }

    const posts = await this.postRepository.findByUris(postUris);
    const [postViews, replyRefMap, repostProfiles] = await Promise.all([
      this.postViewService.findPostView(postUris),
      this.replyRefService.createReplyRefs(posts),
      this.profileViewService.findProfileViewBasic(repostActorDids),
    ]);

    // URIでpostViewを検索できるようにマップ化
    const postViewMap = new Map(postViews.map((pv) => [pv.uri, pv]));
    // DIDでprofileViewBasicを検索できるようにマップ化
    const profileViewBasicMap = new Map(repostProfiles.map((p) => [p.did, p]));

    const feed: $Typed<AppBskyFeedDefs.FeedViewPost>[] = [];

    for (const item of paginationResult.items) {
      if (item.type === "post") {
        const postView = postViewMap.get(item.uri);
        if (postView) {
          feed.push({
            $type: "app.bsky.feed.defs#feedViewPost" as const,
            post: postView,
            reply: replyRefMap.get(postView.uri),
          });
        }
      } else if (item.subjectUri) {
        const postView = postViewMap.get(item.subjectUri);
        const profileViewBasic = profileViewBasicMap.get(item.actorDid);
        if (postView && profileViewBasic) {
          feed.push({
            $type: "app.bsky.feed.defs#feedViewPost" as const,
            post: postView,
            reply: replyRefMap.get(postView.uri),
            reason: {
              $type: "app.bsky.feed.defs#reasonRepost" as const,
              by: profileViewBasic,
              indexedAt: item.sortAt.toISOString(),
            },
          });
        }
      }
    }

    const result: AppBskyFeedGetTimeline.OutputSchema = {
      feed,
    };
    if (paginationResult.cursor) {
      result.cursor = paginationResult.cursor;
    }
    return result;
  }
}
