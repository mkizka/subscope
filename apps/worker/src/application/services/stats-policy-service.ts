import { AtUri } from "@atproto/syntax";

import { parseFollow } from "../dto/follow.js";
import { parseLike } from "../dto/like.js";
import { parsePost } from "../dto/post.js";
import type { Record } from "../dto/record.js";
import { parseRepost } from "../dto/repost.js";
import type { StatsTargets } from "../dto/stats-targets.js";

export class StatsPolicyService {
  targetsFor({
    record,
    action,
  }: {
    record: Record;
    action: "upsert" | "delete";
  }): StatsTargets {
    switch (record.uri.collection) {
      case "app.bsky.feed.post": {
        const post = parsePost(record);
        const embedUri =
          post.embed?.type === "record" ||
          post.embed?.type === "recordWithMedia"
            ? post.embed.uri
            : null;
        return {
          accounts: [post.accountDid],
          posts: [
            // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
            // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
            //    → このとき、リポスト数が0なので1にする必要がある
            ...(action === "upsert" ? [post.uri] : []),
            ...(post.replyParent ? [post.replyParent.uri] : []),
            ...(embedUri ? [embedUri] : []),
          ],
        };
      }
      case "app.bsky.feed.repost":
        return {
          accounts: [],
          posts: [new AtUri(parseRepost(record).subjectUri)],
        };
      case "app.bsky.feed.like":
        return {
          accounts: [],
          posts: [new AtUri(parseLike(record).subjectUri)],
        };
      case "app.bsky.graph.follow": {
        const follow = parseFollow(record);
        return { accounts: [follow.accountDid, follow.subjectDid], posts: [] };
      }
      default:
        return { accounts: [], posts: [] };
    }
  }
}
