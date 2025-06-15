import { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyFeedDefs } from "@repo/client/server";
import type { Post } from "@repo/common/domain";

import type { PostViewService } from "./post-view-service.js";

type ReplyPost = Post & {
  replyRoot: NonNullable<Post["replyRoot"]>;
  replyParent: NonNullable<Post["replyParent"]>;
};

export class ReplyRefService {
  constructor(private readonly postViewService: PostViewService) {}
  static inject = ["postViewService"] as const;

  async createReplyRefs(
    posts: Post[],
  ): Promise<Map<string, $Typed<AppBskyFeedDefs.ReplyRef>>> {
    const replyPosts = posts.filter((post): post is ReplyPost =>
      post.isReply(),
    );

    if (replyPosts.length === 0) {
      return new Map();
    }

    // 必要なroot/parent URIを収集（重複排除）
    const replyUris = new Set<string>();
    for (const post of replyPosts) {
      replyUris.add(post.replyRoot.uri.toString());
      replyUris.add(post.replyParent.uri.toString());
    }

    // 一括でPostViewを取得
    const replyAtUris = Array.from(replyUris).map((uri) => new AtUri(uri));
    const replyPostViews = await this.postViewService.findPostView(replyAtUris);

    // URI → PostView のマップを作成
    const postViewMap = new Map<
      string,
      $Typed<AppBskyFeedDefs.PostView> | $Typed<AppBskyFeedDefs.NotFoundPost>
    >();
    replyAtUris.forEach((uri, index) => {
      const postView = replyPostViews[index];
      if (postView) {
        postViewMap.set(uri.toString(), postView);
      } else {
        postViewMap.set(uri.toString(), {
          $type: "app.bsky.feed.defs#notFoundPost",
          uri: uri.toString(),
          notFound: true,
        });
      }
    });

    // 各リプライ投稿のReplyRefを作成
    const replyRefMap = new Map<string, $Typed<AppBskyFeedDefs.ReplyRef>>();
    replyPosts.forEach((post) => {
      const rootView = postViewMap.get(post.replyRoot.uri.toString());
      const parentView = postViewMap.get(post.replyParent.uri.toString());

      if (rootView && parentView) {
        replyRefMap.set(post.uri.toString(), {
          $type: "app.bsky.feed.defs#replyRef",
          root: rootView,
          parent: parentView,
        });
      }
    });

    return replyRefMap;
  }
}
