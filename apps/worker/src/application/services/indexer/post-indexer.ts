import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import { feedItemFromPost } from "../../dto/feed-item.js";
import { getEmbedRecordUri, parsePost, type Post } from "../../dto/post.js";
import type { Record } from "../../dto/record.js";
import { getSortAt } from "../../dto/sort-at.js";
import type { IPostQuery } from "../../interfaces/queries/post-query.js";
import type { IFeedItemRepository } from "../../interfaces/repositories/feed-item-repository.js";
import type { Notification } from "../../interfaces/repositories/notification-repository.js";
import type { IPostRepository } from "../../interfaces/repositories/post-repository.js";
import type { ICollectionIndexer } from "./collection-indexer.js";

type ParsedPost = { post: Post; mentionDids: Did[] };

const REPLY_NOTIFICATION_DEPTH = 4;

export class PostIndexer implements ICollectionIndexer<ParsedPost> {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly feedItemRepository: IFeedItemRepository,
    private readonly postQuery: IPostQuery,
  ) {}

  parse(record: Record) {
    return parsePost(record);
  }

  pastWindowDate(parsed: ParsedPost) {
    return parsed.post.createdAt;
  }

  async save({
    ctx,
    parsed: { post },
  }: {
    ctx: TransactionContext;
    parsed: ParsedPost;
  }) {
    await this.postRepository.save({ ctx, post });
    await this.feedItemRepository.save({
      ctx,
      feedItem: feedItemFromPost(post),
    });
  }

  recordsToFetch({ parsed }: { parsed: ParsedPost }) {
    const embedUri = getEmbedRecordUri(parsed.post);
    return embedUri ? [embedUri] : [];
  }

  async notificationCandidates({
    ctx,
    parsed: { post, mentionDids },
  }: {
    ctx: TransactionContext;
    parsed: ParsedPost;
  }): Promise<Notification[]> {
    const quoteUri = getEmbedRecordUri(post);
    const replySubjects: AtUri[] = [];
    for (
      let uri = post.replyParent?.uri ?? null;
      uri && replySubjects.length < REPLY_NOTIFICATION_DEPTH;
      uri = await this.postQuery.findReplyParentUri(ctx, uri)
    ) {
      replySubjects.push(uri);
    }
    const common = {
      recordUri: post.uri.toString(),
      authorDid: post.accountDid,
      sortAt: getSortAt(post),
    };
    return [
      ...mentionDids.map((did) => ({
        ...common,
        recipientDid: did,
        reason: "mention" as const,
        reasonSubject: null,
      })),
      ...(quoteUri?.collection === "app.bsky.feed.post"
        ? [
            {
              ...common,
              recipientDid: quoteUri.hostname,
              reason: "quote" as const,
              reasonSubject: quoteUri.toString(),
            },
          ]
        : []),
      ...replySubjects.map((uri) => ({
        ...common,
        recipientDid: uri.hostname,
        reason: "reply" as const,
        reasonSubject: uri.toString(),
      })),
    ];
  }

  postsToAggregate({ post }: ParsedPost) {
    const embedUri =
      post.embed?.type === "record" || post.embed?.type === "recordWithMedia"
        ? post.embed.uri
        : null;
    return [
      // 投稿をインデックスする時点でいいね/リポストが存在する可能性があるので集計する
      // 例：リポストをインデックス → fetchRecordジョブでリポスト対象をインデックス
      //    → このとき、リポスト数が0なので1にする必要がある
      post.uri,
      ...(post.replyParent ? [post.replyParent.uri] : []),
      ...(embedUri ? [embedUri] : []),
    ];
  }

  accountsToAggregate({ post }: ParsedPost) {
    return [post.accountDid];
  }
}
