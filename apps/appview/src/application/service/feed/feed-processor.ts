import type { Did } from "@atproto/did";
import type { $Typed } from "@atproto/lex";
import { AtUri, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { IPostRepository } from "../../../application/interfaces/post-repository.js";
import type { IRepostRepository } from "../../../application/interfaces/repost-repository.js";
import type { ProfileViewService } from "../../../application/service/actor/profile-view-service.js";
import { toMapByDid, toMapByUri } from "../../../application/utils/map.js";
import type { PostViewService } from "./post-view-service.js";
import type { ReplyRefService } from "./reply-ref-service.js";

export class FeedProcessor {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly repostRepository: IRepostRepository,
    private readonly postViewService: PostViewService,
    private readonly profileViewService: ProfileViewService,
    private readonly replyRefService: ReplyRefService,
  ) {}

  async processFeedItems(
    feedItems: FeedItemDto[],
    viewerDid?: Did,
  ): Promise<$Typed<AppBskyFeedDefs.FeedViewPost>[]> {
    const postUris = new Set<string>();
    const repostUris = new Set<string>();
    const reposterDids = new Set<Did>();

    for (const item of feedItems) {
      if (item.type === "post") {
        postUris.add(item.uri);
      } else if (item.subjectUri) {
        postUris.add(item.subjectUri);
        repostUris.add(item.uri);
        reposterDids.add(item.actorDid);
      }
    }

    const postAtUris = Array.from(postUris).map((uri) => new AtUri(uri));
    const postViewMap = await this.postViewService
      .findPostView(postAtUris, viewerDid)
      .then(toMapByUri);

    const [repostMap, reposterMap] = await Promise.all([
      this.repostRepository.findByUris(Array.from(repostUris)).then(toMapByUri),
      this.profileViewService
        .findProfileViewBasic(Array.from(reposterDids))
        .then(toMapByDid),
    ]);

    const posts = await this.postRepository.findByUris(postAtUris);
    const replyRefMap = await this.replyRefService.findMap(posts);

    return feedItems
      .map((item) => {
        const postUri = item.type === "post" ? item.uri : item.subjectUri;
        if (!postUri) {
          return null;
        }

        const postView = postViewMap.get(postUri);
        if (!postView) {
          return null;
        }

        const feedViewPost: $Typed<AppBskyFeedDefs.FeedViewPost> = {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: postView,
        };

        const replyRef = replyRefMap.get(postUri);
        if (replyRef) {
          feedViewPost.reply = replyRef;
        }

        if (item.type === "repost") {
          const repost = repostMap.get(item.uri);
          if (repost) {
            const reposter = reposterMap.get(repost.actorDid);
            if (reposter) {
              feedViewPost.reason = {
                $type: "app.bsky.feed.defs#reasonRepost",
                by: reposter,
                indexedAt: toDatetimeString(repost.indexedAt),
              };
            }
          }
        }

        return feedViewPost;
      })
      .filter((post) => post !== null);
  }
}
