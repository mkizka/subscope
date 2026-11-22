import { AtUri } from "@atproto/syntax";

import type { ParsedRecord } from "../dto/parsed-record.js";
import type { StatsTargets } from "../dto/stats-targets.js";

export class StatsPolicyService {
  targetsFor(parsed: ParsedRecord): StatsTargets {
    switch (parsed.collection) {
      case "app.bsky.feed.post": {
        const { post } = parsed;
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
            post.uri,
            ...(post.replyParent ? [post.replyParent.uri] : []),
            ...(embedUri ? [embedUri] : []),
          ],
        };
      }
      case "app.bsky.feed.repost":
        return { accounts: [], posts: [new AtUri(parsed.repost.subjectUri)] };
      case "app.bsky.feed.like":
        return { accounts: [], posts: [new AtUri(parsed.like.subjectUri)] };
      case "app.bsky.graph.follow": {
        const { follow } = parsed;
        return { accounts: [follow.accountDid, follow.subjectDid], posts: [] };
      }
      case "app.bsky.graph.listitem":
      case "app.bsky.actor.profile":
      case "app.bsky.feed.generator":
      case "app.bsky.graph.list":
      case "app.bsky.actor.link":
      case "app.bsky.feed.threadgate":
      case "app.bsky.feed.postgate":
        return { accounts: [], posts: [] };
    }
  }
}
